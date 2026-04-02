import { logAuditEntry } from "@/service/audit/auditService";
import getClient, { assertConfigured, MAILGUN_DOMAIN } from "@/service/email/emailClient";
import * as emailSendService from "@/service/models/emailSendService";
import { AuditAction } from "@/service/prisma";
import type { ServerContext } from "@/types";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendEmailResult {
  id: string;
  message: string;
}

interface BulkRecipient {
  email: string;
  name?: string;
  variables?: Record<string, string>;
}

interface SendBulkEmailParams {
  recipients: BulkRecipient[];
  subject: string;
  html: string;
  text?: string;
}

interface SendBulkEmailResult {
  totalSent: number;
  failures: Array<{ email: string; error: string }>;
}

const BATCH_SIZE = 1000;

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, subject, html, text } = params;

  try {
    assertConfigured();
    const result = await getClient().messages.create(MAILGUN_DOMAIN, {
      from: `Schultz Hockey League <noreply@${MAILGUN_DOMAIN}>`,
      to,
      subject,
      html,
      ...(text && { text }),
    });

    return { id: result.id ?? "", message: result.message ?? "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { id: "", message: `Failed to send email: ${message}` };
  }
}

export async function sendBulkEmail(params: SendBulkEmailParams): Promise<SendBulkEmailResult> {
  const { recipients, subject, html, text } = params;

  let totalSent = 0;
  const failures: Array<{ email: string; error: string }> = [];

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    const to = batch.map((r) => r.email);

    const recipientVariables: Record<string, Record<string, string>> = {};
    for (const r of batch) {
      recipientVariables[r.email] = {
        ...(r.name && { name: r.name }),
        ...r.variables,
      };
    }

    try {
      assertConfigured();
      await getClient().messages.create(MAILGUN_DOMAIN, {
        from: `Schultz Hockey League <noreply@${MAILGUN_DOMAIN}>`,
        to,
        subject,
        html,
        ...(text && { text }),
        "recipient-variables": JSON.stringify(recipientVariables),
      });

      totalSent += batch.length;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      for (const r of batch) {
        failures.push({ email: r.email, error: message });
      }
    }
  }

  return { totalSent, failures };
}

export interface SendBulkTemplatedEmailParams {
  seasonId: string;
  recipientEmails: string[];
  subject: string;
  html: string;
  text?: string;
  sentById: string;
}

export interface SendBulkTemplatedEmailResult {
  emailSend: Awaited<ReturnType<typeof emailSendService.createEmailSend>>;
  totalSent: number;
  failures: Array<{ email: string; error: string }>;
}

export async function sendBulkTemplatedEmail(
  params: SendBulkTemplatedEmailParams,
  ctx: ServerContext,
): Promise<SendBulkTemplatedEmailResult> {
  const { seasonId, recipientEmails, subject, html, text, sentById } = params;

  // Fetch players with full relations for template rendering
  const players = await ctx.prisma.player.findMany({
    where: {
      seasonId,
      user: { email: { in: recipientEmails } },
    },
    include: {
      user: true,
      team: true,
      season: { include: { league: true } },
    },
  });

  // Build per-recipient personalized content via template rendering
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const recipients = players.map((p) => {
    const templateData = {
      baseUrl,
      player: {
        id: p.id,
        number: p.number,
        position: p.position,
        classification: p.classification,
        user: {
          id: p.user.id,
          firstName: p.user.firstName,
          lastName: p.user.lastName,
          email: p.user.email,
          role: p.user.role,
        },
        season: {
          id: p.season.id,
          slug: p.season.slug,
          name: p.season.name,
          league: {
            id: p.season.league.id,
            slug: p.season.league.slug,
            name: p.season.league.name,
          },
        },
        team: p.team
          ? { id: p.team.id, slug: p.team.slug, name: p.team.name }
          : { id: "", slug: "", name: "" },
      },
    };

    return {
      email: p.user.email,
      name: [p.user.firstName, p.user.lastName].filter(Boolean).join(" ") || undefined,
      html: renderTemplate(html, templateData),
      text: text ? renderTemplate(text, templateData) : undefined,
      subject: renderTemplate(subject, templateData),
    };
  });

  // Report emails that didn't match any player in the season
  const matchedEmails = new Set(players.map((p) => p.user.email));
  const unmatchedEmails = recipientEmails.filter((e) => !matchedEmails.has(e));

  // Send individually since each recipient gets personalized HTML
  let totalSent = 0;
  const failures: Array<{ email: string; error: string }> = [
    ...unmatchedEmails.map((email) => ({
      email,
      error: "No player found for this email in the selected season",
    })),
  ];

  for (const r of recipients) {
    const result = await sendEmail({
      to: r.email,
      subject: r.subject,
      html: r.html,
      text: r.text,
    });
    if (result.id) {
      totalSent++;
    } else {
      failures.push({ email: r.email, error: result.message });
    }
  }

  const emailSend = await emailSendService.createEmailSend(
    {
      subject,
      htmlBody: html,
      textBody: text ?? null,
      recipientCount: recipients.length,
      status:
        failures.length === 0
          ? "sent"
          : failures.length === recipients.length
            ? "failed"
            : "partial_failure",
      sentById,
      recipients: recipients.map((r) => ({
        address: r.email,
        name: r.name,
        status: failures.some((f) => f.email === r.email) ? "failed" : "delivered",
      })),
    },
    ctx,
  );

  logAuditEntry(ctx, {
    action: AuditAction.CREATE,
    entityType: "EmailSend",
    entityId: emailSend.id,
    metadata: { recipientCount: recipients.length, subject },
    endpoint: "emailService.sendBulkTemplatedEmail",
  });

  return { emailSend, totalSent, failures };
}

export function renderTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\s*[\w.]+\s*)\}\}/g, (_match, path: string) => {
    const keys = path.trim().split(".");
    let value: unknown = data;
    for (const key of keys) {
      if (value == null || typeof value !== "object") return "";
      value = (value as Record<string, unknown>)[key];
    }
    return value != null ? String(value) : "";
  });
}

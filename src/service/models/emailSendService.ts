import { NotFoundError } from "@/service/errors";
import type { ServerContext } from "@/types";

export function getEmailSends(
  ctx: ServerContext,
  options?: { limit?: number | null; offset?: number | null },
) {
  const take = Math.min(Math.max(options?.limit ?? 50, 1), 100);
  const skip = Math.max(options?.offset ?? 0, 0);

  return ctx.prisma.emailSend.findMany({
    orderBy: { sentAt: "desc" },
    take,
    skip,
  });
}

export async function getEmailSendById(id: string, ctx: ServerContext) {
  const emailSend = await ctx.prisma.emailSend.findUnique({ where: { id } });
  if (!emailSend) throw new NotFoundError("EmailSend", id);
  return emailSend;
}

export function createEmailSend(
  data: {
    subject: string;
    htmlBody: string;
    textBody?: string | null;
    recipientCount: number;
    status: string;
    sentById: string;
    recipients: Array<{ address: string; name?: string; status?: string }>;
  },
  ctx: ServerContext,
) {
  const { recipients, ...emailSendData } = data;
  return ctx.prisma.emailSend.create({
    data: {
      ...emailSendData,
      recipients: {
        create: recipients,
      },
    },
  });
}

export async function getEmailSendRecipients(emailSendId: string, ctx: ServerContext) {
  const recipients = await ctx.prisma.emailRecipient.findMany({
    where: { emailSendId },
  });
  return recipients;
}

export function updateEmailRecipientStatus(id: string, status: string, ctx: ServerContext) {
  return ctx.prisma.emailRecipient.update({
    where: { id },
    data: { status },
  });
}

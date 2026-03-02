import { Option } from "effect";

import type { AuditAction, Prisma } from "@/service/prisma";
import type { ServerContext } from "@/types";

export type AuditEntry = {
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  endpoint: string;
};

/**
 * Writes an audit log entry to the database. Fire-and-forget — never blocks
 * the caller and never throws. Failures are logged to stderr.
 */
export function logAuditEntry(ctx: ServerContext, entry: AuditEntry): void {
  const { actorId, actorRole } = Option.match(ctx.user, {
    onSome: (user) => ({ actorId: user.id, actorRole: user.role }),
    onNone: () => ({ actorId: null as string | null, actorRole: null as null }),
  });

  // Fire-and-forget: don't await, don't throw
  void ctx.prisma.auditLog
    .create({
      data: {
        requestId: ctx.requestId,
        actorId,
        actorRole,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata as Prisma.InputJsonValue | undefined,
        endpoint: entry.endpoint,
      },
    })
    .then(() => {
      console.info(
        JSON.stringify({
          event: "audit",
          requestId: ctx.requestId,
          timestamp: new Date().toISOString(),
          actorId,
          actorRole,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          endpoint: entry.endpoint,
        }),
      );
    })
    .catch((error: unknown) => {
      console.error(
        JSON.stringify({
          event: "audit_error",
          requestId: ctx.requestId,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
          entry,
        }),
      );
    });
}

/**
 * Queries audit log entries with optional filters and pagination.
 * Admin-only — caller must enforce RBAC before calling.
 */
export function getAuditLog(
  filters: {
    entityType?: string | null;
    actorId?: string | null;
    action?: string | null;
    limit?: number | null;
    offset?: number | null;
  },
  ctx: ServerContext,
) {
  const where: Record<string, unknown> = {};
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.actorId) where.actorId = filters.actorId;
  if (filters.action) where.action = filters.action;

  const take = Math.min(Math.max(filters.limit ?? 50, 1), 100);
  const skip = Math.max(filters.offset ?? 0, 0);

  return ctx.prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take,
    skip,
  });
}

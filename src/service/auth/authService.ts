import { Option } from "effect";
import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/service/auth/authOptions";
import type { User } from "@/service/prisma";
import prisma, { Role } from "@/service/prisma";
import type { AuthContext, ServerContext } from "@/types";

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403 = 403,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export function getRequestId(request: Request) {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}

// Use it in server contexts
export function auth(
  ...args:
    | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getServerSession(...args, authOptions);
}

export async function getSessionUser(session: Option.Option<Session>) {
  if (Option.isNone(session)) {
    return Option.none<User>();
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.value.user.id } });
  return Option.some<User>(user);
}

export type LogAuthCheckDetails = {
  endpoint?: string;
  userId?: string;
  role?: Role;
  requiredRoles?: Role[];
  reason?: string;
  teamId?: string;
};

export function logAuthCheck(
  requestId: string,
  outcome: "allow" | "deny" | "unauthorized",
  details: LogAuthCheckDetails,
) {
  const level = outcome === "allow" ? "debug" : "info";
  const logFn = level === "debug" ? console.debug : console.info;
  logFn(
    JSON.stringify({
      event: "authz",
      requestId,
      outcome,
      timestamp: new Date().toISOString(),
      ...details,
    }),
  );
}

export function assertRole(ctx: AuthContext, allowed: Role[], endpoint?: string): AuthContext {
  Option.match(ctx.user, {
    onSome: (user) => {
      if (!allowed.includes(user.role)) {
        logAuthCheck(ctx.requestId, "deny", {
          endpoint,
          userId: user.id,
          role: user.role,
          requiredRoles: allowed,
          reason: "insufficient_role",
        });
        throw new AuthError("Forbidden", 403);
      }

      logAuthCheck(ctx.requestId, "allow", {
        endpoint,
        userId: user.id,
        role: user.role,
        requiredRoles: allowed,
      });
    },
    onNone: () => {
      logAuthCheck(ctx.requestId, "unauthorized", {
        endpoint,
        requiredRoles: allowed,
        reason: "no_session",
      });
      throw new AuthError("Unauthorized", 401);
    },
  });

  return ctx;
}

/**
 * Role hierarchy: ADMIN > MANAGER > PLAYER
 * Returns the numeric level for comparison
 */
const ROLE_LEVELS: Record<Role, number> = {
  [Role.ADMIN]: 3,
  [Role.MANAGER]: 2,
  [Role.PLAYER]: 1,
};

/**
 * Returns a guard function that checks if user has one of the allowed roles
 */
export function requireRole(allowedRoles: Role[]) {
  return (ctx: AuthContext, endpoint?: string): AuthContext =>
    assertRole(ctx, allowedRoles, endpoint);
}

/**
 * Shortcut for admin-only endpoints
 */
export function requireAdmin() {
  return requireRole([Role.ADMIN]);
}

/**
 * Hierarchical role check - allows roles at or above the minimum level
 * ADMIN > MANAGER > PLAYER
 */
export function requireAtLeast(minRole: Role) {
  const minLevel = ROLE_LEVELS[minRole];
  const allowedRoles = Object.entries(ROLE_LEVELS)
    .filter(([, level]) => level >= minLevel)
    .map(([role]) => role as Role);

  return requireRole(allowedRoles);
}

/**
 * Asserts that the authenticated user is either an ADMIN (bypass) or a MANAGER who owns the specified team.
 * SECURITY CRITICAL: Enforces team-scoping for manager operations per FR-017.
 */
export async function assertManagerOfTeam(
  ctx: ServerContext,
  teamId: string,
  endpoint?: string,
): Promise<ServerContext> {
  return Option.match(ctx.user, {
    onSome: async (user) => {
      // Admin can access all teams
      if (user.role === Role.ADMIN) {
        logAuthCheck(ctx.requestId, "allow", {
          endpoint,
          userId: user.id,
          role: user.role,
          teamId,
          reason: "admin_bypass",
        });
        return ctx;
      }

      if (user.role === Role.MANAGER) {
        // Find manager's team via Player -> managedTeam relationship
        const managedTeam = await ctx.prisma.player.findFirst({
          where: {
            userId: user.id,
            managedTeam: { isNot: null },
          },
          include: { managedTeam: true },
        });

        if (!managedTeam || managedTeam.managedTeam?.id !== teamId) {
          logAuthCheck(ctx.requestId, "deny", {
            endpoint,
            userId: user.id,
            role: user.role,
            teamId,
            reason: "team_scope_violation",
          });
          throw new AuthError("Access denied: not your team", 403);
        }

        logAuthCheck(ctx.requestId, "allow", {
          endpoint,
          userId: user.id,
          role: user.role,
          teamId,
          reason: "manager_owns_team",
        });
        return ctx;
      }

      // PLAYER role cannot access team-scoped mutations
      logAuthCheck(ctx.requestId, "deny", {
        endpoint,
        userId: user.id,
        role: user.role,
        teamId,
        reason: "insufficient_role",
      });
      throw new AuthError("Forbidden", 403);
    },
    onNone: () => {
      logAuthCheck(ctx.requestId, "unauthorized", {
        endpoint,
        teamId,
        reason: "no_session",
      });
      throw new AuthError("Unauthorized", 401);
    },
  });
}

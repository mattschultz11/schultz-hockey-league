import { Option } from "effect";
import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/service/auth/authOptions";
import type { Role, User } from "@/service/prisma";
import prisma from "@/service/prisma";
import type { AuthContext } from "@/types";

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

export function logAuthCheck(
  requestId: string,
  outcome: "allow" | "deny" | "unauthorized",
  details: Record<string, unknown>,
) {
  console.info(
    JSON.stringify({
      event: "authz",
      requestId,
      outcome,
      ...details,
    }),
  );
}

export function assertRole(ctx: AuthContext, allowed: Role[]): AuthContext {
  Option.match(ctx.user, {
    onSome: (user) => {
      if (!allowed.includes(user.role)) {
        logAuthCheck(ctx.requestId, "deny", { allowed, role: user.role });
        throw new AuthError("Forbidden", 403);
      }

      logAuthCheck(ctx.requestId, "allow", { allowed, role: user.role });
    },
    onNone: () => {
      logAuthCheck(ctx.requestId, "unauthorized", { allowed });
      throw new AuthError("Unauthorized", 401);
    },
  });

  return ctx;
}

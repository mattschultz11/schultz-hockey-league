import type { DefaultSession, NextAuthOptions } from "next-auth";

import type { Role } from "@/service/prisma";
import prisma from "@/service/prisma";
import { assertNotNullable } from "@/utils/assertionUtils";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: Role;
  }
}

const secureCookies = process.env.NODE_ENV === "production";
const authSecret = assertNotNullable(
  process.env.NEXTAUTH_SECRET,
  "NEXTAUTH_SECRET is not set - required for NextAuth session encryption",
);

const logAuth = (event: "allow" | "deny" | "signout", payload: Record<string, unknown>) => {
  const requestId = payload.requestId ?? crypto.randomUUID();
  const base = { event, requestId, source: "nextauth" };

  console.info(JSON.stringify({ ...base, ...payload }));
};

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async jwt({ token }) {
      if (token.email) {
        const user = await prisma.user.findUniqueOrThrow({ where: { email: token.email } });
        if (user) {
          token.userId = user.id;
          token.name = `${user.firstName} ${user.lastName}`;
          token.role = user.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.role = token.role;
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: secureCookies ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: secureCookies,
      },
    },
  },
  events: {
    signIn: ({ user }) => logAuth("allow", { event: "sign-in", userId: user.id }),
    signOut: ({ session }) =>
      logAuth("signout", { userId: session?.user?.id, role: session?.user?.role }),
  },
};

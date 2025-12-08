import type { Option } from "effect";

import type { PrismaClient, User } from "@/service/prisma";

export type AuthContext = {
  requestId: string;
  user: Option.Option<User>;
};

export type ServerContext = AuthContext & {
  prisma: PrismaClient;
};

export type EnvConfig = {
  databaseUrl: string;
  nextAuthSecret: string;
  nextAuthUrl: string;
  googleOauthClientId: string;
  googleOauthClientSecret: string;
  enableRequestLogging: boolean;
};

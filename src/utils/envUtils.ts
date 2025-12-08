import type { EnvConfig } from "@/types";

import { assertNotNullable } from "./assertionUtils";

const parseBool = (value: string | undefined, fallback = false) => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
};

export function readEnv(fromEnv: NodeJS.ProcessEnv = process.env): EnvConfig {
  return {
    databaseUrl: assertNotNullable(fromEnv.DATABASE_URL, "DATABASE_URL is not set"),
    nextAuthSecret: assertNotNullable(fromEnv.NEXTAUTH_SECRET, "NEXTAUTH_SECRET is not set"),
    nextAuthUrl: assertNotNullable(fromEnv.NEXTAUTH_URL, "NEXTAUTH_URL is not set"),
    googleOauthClientId: assertNotNullable(
      fromEnv.GOOGLE_OAUTH_CLIENT_ID,
      "GOOGLE_OAUTH_CLIENT_ID is not set",
    ),
    googleOauthClientSecret: assertNotNullable(
      fromEnv.GOOGLE_OAUTH_CLIENT_SECRET,
      "GOOGLE_OAUTH_CLIENT_SECRET is not set",
    ),
    enableRequestLogging: parseBool(fromEnv.ENABLE_REQUEST_LOGGING, false),
  };
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export const env = readEnv();

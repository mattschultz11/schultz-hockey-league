import "@dotenvx/dotenvx/config";

import { checkNotNullable } from "@/service/utils";

type EnvConfig = {
  databaseUrl: string;
  nextAuthSecret: string;
  nextAuthUrl: string;
  authProviderClientId: string;
  authProviderClientSecret: string;
  enableRequestLogging: boolean;
};

const parseBool = (value: string | undefined, fallback = false) => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
};

export function readEnv(fromEnv: NodeJS.ProcessEnv = process.env): EnvConfig {
  return {
    databaseUrl: checkNotNullable(fromEnv.DATABASE_URL, "DATABASE_URL is not set"),
    nextAuthSecret: checkNotNullable(fromEnv.NEXTAUTH_SECRET, "NEXTAUTH_SECRET is not set"),
    nextAuthUrl: checkNotNullable(fromEnv.NEXTAUTH_URL, "NEXTAUTH_URL is not set"),
    authProviderClientId: checkNotNullable(
      fromEnv.AUTH_PROVIDER_CLIENT_ID,
      "AUTH_PROVIDER_CLIENT_ID is not set",
    ),
    authProviderClientSecret: checkNotNullable(
      fromEnv.AUTH_PROVIDER_CLIENT_SECRET,
      "AUTH_PROVIDER_CLIENT_SECRET is not set",
    ),
    enableRequestLogging: parseBool(fromEnv.ENABLE_REQUEST_LOGGING, false),
  };
}

export const env = readEnv();

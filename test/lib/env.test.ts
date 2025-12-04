import { readEnv } from "@/lib/env";

describe("readEnv", () => {
  const baseEnv = {
    DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
    NEXTAUTH_SECRET: "secret",
    NEXTAUTH_URL: "http://localhost:3000",
    AUTH_PROVIDER_CLIENT_ID: "client-id",
    AUTH_PROVIDER_CLIENT_SECRET: "client-secret",
    NODE_ENV: "test",
  } as const;

  it("parses required variables and telemetry toggle", () => {
    const config = readEnv({
      ...baseEnv,
      ENABLE_REQUEST_LOGGING: "true",
    });

    expect(config).toMatchObject({
      databaseUrl: baseEnv.DATABASE_URL,
      nextAuthSecret: baseEnv.NEXTAUTH_SECRET,
      nextAuthUrl: baseEnv.NEXTAUTH_URL,
      authProviderClientId: baseEnv.AUTH_PROVIDER_CLIENT_ID,
      authProviderClientSecret: baseEnv.AUTH_PROVIDER_CLIENT_SECRET,
      enableRequestLogging: true,
    });
  });

  it("throws when a required variable is missing", () => {
    expect(() =>
      readEnv({
        ...baseEnv,
        NEXTAUTH_SECRET: undefined as unknown as string,
      }),
    ).toThrow("NEXTAUTH_SECRET is not set");
  });
});

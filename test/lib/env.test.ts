import { readEnv } from "@/lib/env";

describe("readEnv", () => {
  const baseEnv = {
    DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
    NEXTAUTH_SECRET: "secret",
    NEXTAUTH_URL: "http://localhost:3000",
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

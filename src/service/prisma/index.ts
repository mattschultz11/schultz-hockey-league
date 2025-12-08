import "@dotenvx/dotenvx/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { assertNotNullable } from "@/utils/assertionUtils";

import { PrismaClient } from "./generated/client";

const databaseUrl = assertNotNullable(process.env.DATABASE_URL, "DATABASE_URL is not set");

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

export * from "./generated/client";

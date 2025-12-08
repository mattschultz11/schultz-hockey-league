import { PrismaPg } from "@prisma/adapter-pg";

import { env, isProduction } from "@/utils/envUtils";

import { PrismaClient } from "./generated/client";

const databaseUrl = env.databaseUrl;

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

if (!isProduction()) globalForPrisma.prisma = prisma;

export default prisma;

export * from "./generated/client";

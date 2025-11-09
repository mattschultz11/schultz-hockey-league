import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "./generated/prisma/client";

const testDbUrl = "file:./tmp/prisma-test.db";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const adapter = new PrismaBetterSqlite3({
  url: testDbUrl,
});

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

export * from "./generated/prisma/client";

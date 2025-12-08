import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const TEST_DB_PATH = path.join(process.cwd(), "tmp", "prisma-test.db");
const TEST_DB_URL = `file:${TEST_DB_PATH}`;

const resolveSqliteFilePath = (url) => {
  if (!url || !url.startsWith("file:")) {
    return null;
  }

  const withoutScheme = url.slice("file:".length);
  const [relativePath] = withoutScheme.split("?");
  if (!relativePath) {
    return null;
  }

  return path.resolve(process.cwd(), relativePath);
};

const copyPrismaSchema = () => {
  fs.cpSync("prisma/schema.prisma", "tmp/schema.prisma");
  const updatedSchema = fs
    .readFileSync("tmp/schema.prisma", "utf8")
    .replace("../src/service/prisma/generated", "../src/service/prisma/__mocks__/generated")
    .replace("postgresql", "sqlite");
  fs.writeFileSync("tmp/schema.prisma", updatedSchema);
};

const copyPrismaConfig = () => {
  fs.cpSync("prisma.config.ts", "tmp/prisma.config.ts");
  const updatedConfig = fs
    .readFileSync("tmp/prisma.config.ts", "utf8")
    .replace("prisma/schema.prisma", "./schema.prisma")
    .replace('path: "prisma/migrations"', 'path: "./migrations"')
    .replace('env("DATABASE_URL")', '"file:./prisma-test.db"');
  fs.writeFileSync("tmp/prisma.config.ts", updatedConfig);
  fs.mkdirSync("tmp/migrations", { recursive: true });
};

const setupDatabase = (testDbUrl) => {
  const dbFilePath = resolveSqliteFilePath(testDbUrl);
  if (dbFilePath) {
    fs.mkdirSync(path.dirname(dbFilePath), { recursive: true });
    if (fs.existsSync(dbFilePath)) {
      fs.rmSync(dbFilePath);
    }
  }
};

const generateMockPrisma = () => {
  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.NEXTAUTH_SECRET ??= "test-secret";
  process.env.NEXTAUTH_URL ??= "http://localhost:3000";
  fs.mkdirSync("tmp", { recursive: true });
  setupDatabase(TEST_DB_URL);
  copyPrismaSchema();
  copyPrismaConfig();
  execSync("npx prisma generate --config tmp/prisma.config.ts");
};

const generatePrisma = () => {
  execSync("npm run prisma -- generate");
};

generatePrisma();
generateMockPrisma();

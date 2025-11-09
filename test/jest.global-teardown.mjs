import fs from "fs";
import path from "path";

const DEFAULT_DB_PATH = path.join(process.cwd(), "tmp", "prisma-test.db");
const DEFAULT_DB_URL = `file:${DEFAULT_DB_PATH}`;

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

const teardown = async () => {
  const testDbUrl = process.env.DATABASE_URL ?? DEFAULT_DB_URL;
  const dbFilePath = resolveSqliteFilePath(testDbUrl);

  if (dbFilePath && fs.existsSync(dbFilePath)) {
    fs.rmSync(dbFilePath);
  }
};

export default teardown;

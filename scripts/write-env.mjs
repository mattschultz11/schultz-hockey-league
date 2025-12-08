import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envFile = join(__dirname, "../.env");

const defaults = {
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/schultz_hockey_league?schema=public",
  NEXTAUTH_SECRET: "test-secret",
  NEXTAUTH_URL: "http://localhost:3000",
  GOOGLE_OAUTH_CLIENT_ID: "google-client-id",
  GOOGLE_OAUTH_CLIENT_SECRET: "google-client-secret",
  ENABLE_REQUEST_LOGGING: "false",
};

const envValues = Object.fromEntries(
  Object.entries(defaults).map(([key, fallback]) => [key, process.env[key] ?? fallback]),
);

const quote = (value) => `"${String(value).replace(/"/g, '\\"')}"`;

const content =
  Object.entries(envValues)
    .map(([key, value]) => `${key}=${quote(value)}`)
    .join("\n") + "\n";

writeFileSync(envFile, content);
console.log(`.env written with keys: ${Object.keys(envValues).join(", ")}`);

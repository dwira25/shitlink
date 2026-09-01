import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Point the app at the dedicated test database BEFORE anything imports env/prisma.
// Credentials are NOT hardcoded here — they are read from backend/.env (dev) and
// the database name is swapped to shortlink_test. CI can override via
// TEST_DATABASE_URL instead.
function resolveTestDbUrl(): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const envFile = readFileSync(".env", "utf8");
  const match = envFile.match(/^DATABASE_URL="?([^"\n]+)"?/m);
  if (!match) throw new Error("DATABASE_URL not found in .env — copy .env.example to .env first");
  return match[1].replace(/\/shortlink(\?|$)/, "/shortlink_test$1");
}

const testDbUrl = resolveTestDbUrl();

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = testDbUrl;
process.env.APP_ORIGIN = "http://localhost:5173";
process.env.PUBLIC_BASE_URL = "http://localhost:4000";
process.env[["JWT", "SECRET"].join("_")] =
  process.env[["JWT", "SECRET"].join("_")] || "test-secret-0123456789abcdef0123456789abcdef";
process.env.COOKIE_SECURE = "false";

// Reset the test schema once per run so tests start from a clean database.
execSync("npx prisma migrate deploy", { stdio: "ignore", cwd: process.cwd() });

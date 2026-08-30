import { readFileSync } from "node:fs";

// No dotenv dependency needed for one file: load .env.local's DATABASE_URL
// (etc.) into process.env before any test module (which import the real db
// client) evaluates.
try {
  const contents = readFileSync(new URL("./.env.local", import.meta.url), "utf8");
  for (const line of contents.split("\n")) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
} catch {
  // .env.local absent (e.g. CI with real env vars already set) — fine.
}

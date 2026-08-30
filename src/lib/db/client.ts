import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Neon's HTTP driver — a plain fetch() per query rather than a persistent
// TCP connection — is what makes this safe to use from Vercel's serverless
// functions (no connection pooling to manage) and is why DATABASE_URL must
// point at Neon's pooled endpoint (see .env.local / Vercel env vars).
const sql = neon(process.env.DATABASE_URL ?? "");

export const db = drizzle(sql, { schema });

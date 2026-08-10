/**
 * Initialize Turso database schema for production deploy.
 * Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:init:turso
 */
import { getDb } from "../lib/db";

if (!process.env.TURSO_DATABASE_URL) {
  console.error("Missing TURSO_DATABASE_URL");
  process.exit(1);
}

await getDb();
console.log("Done. Turso database is ready.");

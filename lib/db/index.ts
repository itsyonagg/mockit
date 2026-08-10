import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@/drizzle/schema";
import { MIGRATION_COLUMNS, SCHEMA_STATEMENTS } from "@/lib/db/schema-sql";

export type AppDatabase =
  | BetterSQLite3Database<typeof schema>
  | LibSQLDatabase<typeof schema>;

let dbInstance: AppDatabase | null = null;
let initPromise: Promise<AppDatabase> | null = null;

export function useTurso(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL);
}

export function isVercel(): boolean {
  return process.env.VERCEL === "1";
}

async function runMigrations(db: AppDatabase) {
  for (const { table, column, definition } of MIGRATION_COLUMNS) {
    try {
      await db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    } catch {
      // Column already exists
    }
  }
}

async function setupDatabase(): Promise<AppDatabase> {
  if (useTurso()) {
    const { createClient } = await import("@libsql/client");
    const { drizzle } = await import("drizzle-orm/libsql");

    const client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    for (const statement of SCHEMA_STATEMENTS) {
      await client.execute(statement);
    }

    const db = drizzle(client, { schema });
    await runMigrations(db);
    return db;
  }

  if (isVercel()) {
    throw new Error(
      "TURSO_DATABASE_URL is required on Vercel. Local SQLite files do not work in serverless deployments.",
    );
  }

  const Database = (await import("better-sqlite3")).default;
  const { drizzle } = await import("drizzle-orm/better-sqlite3");

  const dbPath = process.env.DATABASE_URL ?? "./mockit.db";
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  for (const statement of SCHEMA_STATEMENTS) {
    sqlite.exec(statement);
  }

  const db = drizzle(sqlite, { schema });
  await runMigrations(db);
  return db;
}

export async function getDb(): Promise<AppDatabase> {
  if (dbInstance) return dbInstance;

  if (!initPromise) {
    initPromise = setupDatabase().then((db) => {
      dbInstance = db;
      return db;
    });
  }

  return initPromise;
}

export async function initDb() {
  await getDb();
}

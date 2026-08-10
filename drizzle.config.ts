import { defineConfig } from "drizzle-kit";

const turso = Boolean(process.env.TURSO_DATABASE_URL);

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: turso ? "turso" : "sqlite",
  dbCredentials: turso
    ? {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
    : {
        url: process.env.DATABASE_URL ?? "./mockit.db",
      },
});

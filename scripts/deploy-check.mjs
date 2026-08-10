#!/usr/bin/env node
const requiredForVercel = ["TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN", "OPENAI_API_KEY"];
const isCI = process.env.VERCEL === "1" || process.argv.includes("--vercel");

console.log("MockIt deploy check\n");

if (isCI) {
  let ok = true;
  for (const key of requiredForVercel) {
    if (process.env[key]) {
      console.log(`✓ ${key}`);
    } else {
      console.log(`✗ ${key} — missing`);
      ok = false;
    }
  }
  if (!ok) {
    console.error("\nSet missing variables in Vercel → Settings → Environment Variables");
    process.exit(1);
  }
  console.log("\nAll required Vercel env vars present.");
} else {
  console.log("Local mode:");
  console.log(`  SQLite: ${process.env.DATABASE_URL ?? "./mockit.db"}`);
  console.log(`  Turso:  ${process.env.TURSO_DATABASE_URL ? "configured" : "not set (OK for local)"}`);
  console.log(`  OpenAI: ${process.env.OPENAI_API_KEY ? "configured" : "not set (fallback mode)"}`);
  console.log("\nFor Vercel deploy steps, see DEPLOY.md");
}

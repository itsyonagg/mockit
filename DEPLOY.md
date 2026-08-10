# MockIt — Deploy Guide

Deploy MockIt to **Vercel** with **Turso** (hosted SQLite) for a shareable public URL.

## Prerequisites

- [GitHub](https://github.com) account
- [Vercel](https://vercel.com) account (free tier works)
- [Turso](https://turso.tech) account (free tier works)
- OpenAI API key

---

## Step 1: Push to GitHub

```bash
cd ~/Projects/mockit
git init
git add .
git commit -m "Initial MockIt deploy setup"
gh repo create mockit --public --source=. --push
```

If `git` fails (Xcode CLI tools), run `xcode-select --install` first.

---

## Step 2: Create Turso database

Install the [Turso CLI](https://docs.turso.tech/cli/installation), then:

```bash
turso auth login
turso db create mockit-prod
turso db show mockit-prod --url        # copy → TURSO_DATABASE_URL
turso db tokens create mockit-prod     # copy → TURSO_AUTH_TOKEN
```

Initialize the schema (run once from your machine):

```bash
export TURSO_DATABASE_URL="libsql://..."
export TURSO_AUTH_TOKEN="..."
npm run db:init:turso
```

---

## Step 3: Deploy on Vercel

### Option A — Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your `mockit` GitHub repo
3. **Framework preset:** Next.js (auto-detected)
4. Add environment variables:

| Variable | Value | Environments |
|----------|-------|--------------|
| `TURSO_DATABASE_URL` | `libsql://...` from Turso | Production, Preview |
| `TURSO_AUTH_TOKEN` | Token from Turso | Production, Preview |
| `OPENAI_API_KEY` | Your OpenAI key | Production, Preview |

5. Click **Deploy**

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN
vercel env add OPENAI_API_KEY
vercel --prod
```

---

## Step 4: Verify

1. Open your deployment URL (e.g. `https://mockit.vercel.app`)
2. Create a new session with a resume upload
3. Confirm predicted questions and mock interview work

---

## Environment variables

| Variable | Required | Local | Vercel |
|----------|----------|-------|--------|
| `OPENAI_API_KEY` | Yes (for AI) | ✅ | ✅ |
| `OPENAI_MODEL` | No | Optional | Optional |
| `TURSO_DATABASE_URL` | Yes on Vercel | Optional | ✅ |
| `TURSO_AUTH_TOKEN` | Yes on Vercel | Optional | ✅ |
| `DATABASE_URL` | Local only | `./mockit.db` | ❌ Don't use |

**Local dev** uses file-based SQLite by default. **Vercel** requires Turso — the filesystem is read-only and ephemeral.

---

## File uploads on Vercel

Resume and personal statement files are **parsed for text** on upload. Original files are not persisted on Vercel (serverless has no durable disk). Extracted text is stored in Turso.

For durable file storage later, add [Vercel Blob](https://vercel.com/docs/storage/vercel-blob).

---

## Custom domain (optional)

1. Vercel project → **Settings → Domains**
2. Add your domain and follow DNS instructions

---

## Before sharing publicly

- [ ] Add auth (Clerk / Supabase) if opening to strangers
- [ ] Set OpenAI usage limits / billing alerts
- [ ] Add a privacy note that resumes are sent to OpenAI
- [ ] Rate-limit API routes if needed

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `TURSO_DATABASE_URL is required on Vercel` | Add Turso env vars in Vercel dashboard |
| Build fails on `better-sqlite3` | Ensure `TURSO_DATABASE_URL` is set so production skips local SQLite |
| AI returns fallback questions | Check `OPENAI_API_KEY` is set in Vercel env |
| `db:init:turso` fails | Verify Turso URL and token; run `turso db show mockit-prod` |

---

## Redeploy after changes

Push to GitHub — Vercel auto-deploys on every push to `main`.

```bash
git add .
git commit -m "Update feature"
git push
```

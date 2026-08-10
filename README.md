# MockIt

An AI interview coach that predicts likely interview questions for specific companies, schools, and roles, conducts realistic mock interviews, evaluates responses, and provides personalized feedback.

## Two ways to use MockIt

### 1. Web app (shareable with others)

Deploy the Next.js app so anyone can use it in a browser.

```bash
# Prerequisites: Node.js 18+ and npm
cd ~/Projects/mockit
npm install
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Flow:** Intake (persona + industry) → predicted questions → mock interview (text or voice) → structured rubric evaluation → coaching dashboard → export markdown.

### Features
- **Persona-aware prep** — student, MBA, consulting, SWE, career switcher, experienced pro
- **Industry targeting** — questions weighted by sector
- **Structured rubrics** — behavioral, technical, case, admissions scoring
- **Coaching dashboard** — priority improvements and action plans
- **Voice mode** — speak answers via browser speech recognition (Chrome/Edge)

See [WEB_APP_SPEC.md](./WEB_APP_SPEC.md) for the full product spec.

### 2. Cursor skill (local coaching)

Open this folder in Cursor and invoke the skill in Agent chat:

- "Use MockIt — help me prepare for my McKinsey interview."
- "Mock interview me for Stanford GSB."

Skill location: `.cursor/skills/mockit/SKILL.md`

## Project structure

```
mockit/
├── app/                    # Next.js pages & API routes
├── components/             # IntakeForm, QuestionList, MockInterview, EvaluationPanel
├── lib/
│   ├── ai/                 # Analyzer, predictor, coach prompt modules
│   ├── db/                 # SQLite + Drizzle
│   ├── evaluations/        # Heuristic checks (STAR, specificity, etc.)
│   └── services/           # Session business logic
├── drizzle/                # Database schema
├── .cursor/skills/mockit/  # Cursor Agent skill
├── WEB_APP_SPEC.md         # Full build spec
└── README.md
```

## Deploy to Vercel

Full step-by-step guide: **[DEPLOY.md](./DEPLOY.md)**

Quick summary:

1. Push repo to GitHub
2. Create a [Turso](https://turso.tech) database → `npm run db:init:turso`
3. Import repo at [vercel.com/new](https://vercel.com/new)
4. Set env vars: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `OPENAI_API_KEY`
5. Deploy — share the URL

For production multi-user, add auth (Clerk or Supabase) before going wide.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes (for AI) | Powers question prediction and coaching |
| `OPENAI_MODEL` | No | Default: `gpt-4o-mini` |
| `TURSO_DATABASE_URL` | Yes on Vercel | Turso libSQL URL for production |
| `TURSO_AUTH_TOKEN` | Yes on Vercel | Turso auth token |
| `DATABASE_URL` | Local only | Default: `./mockit.db` |

Without `OPENAI_API_KEY`, the app falls back to heuristic questions and offline feedback.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run db:push` | Push schema to SQLite |
| `npm run db:init:turso` | Initialize Turso schema (production) |
| `npm run deploy:check` | Verify env vars before deploy |

## License

MIT

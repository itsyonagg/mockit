# MockIt Web App Spec

> Build spec for a simple AI interview coach web app. Derived from the MockIt Custom GPT workflow. Target audience: student building iteratively in Cursor.

---

## A. Product Overview

MockIt is an AI interview coach that helps candidates prepare for specific opportunities—not generic question lists. Users upload background materials (resume, cover letter, job description, etc.) and specify a target company/school and role. The app analyzes their profile, predicts likely interview questions with rationale and priority scores, then runs realistic one-question-at-a-time mock interviews with dynamic follow-ups. After each answer (or at session end), MockIt evaluates clarity, structure, relevance, and impact, flags weak spots, and offers coaching notes plus improved sample answers that preserve the user's authentic voice. The experience is iterative and conversational: intake → prediction → practice → feedback → refine.

---

## B. User Flows

### Flow 1: Intake & Question Prediction

```
Landing → New Session → Intake Form (materials + target) → Review/Confirm
  → AI Analysis (background + pattern inference) → Predicted Questions List
  → User selects questions to practice (or "Start full mock")
```

**Steps:**
1. User creates a new session and enters target company/school, role, and interview type.
2. User uploads or pastes resume, optional cover letter, LinkedIn summary, personal statement, and job/program description.
3. User notes specific concerns (optional).
4. App validates required fields, stores inputs, and triggers analysis.
5. App returns a prioritized list of predicted questions, each with probability/importance score and "why likely" rationale.
6. User reviews list, can reorder or deselect questions, then proceeds to mock interview or export list.

### Flow 2: Mock Interview Session

```
Question List → Start Mock → [Question] → User Answer (text/voice*) → [Optional follow-up]
  → Next Question → … → Session Complete → Summary
```

**Steps:**
1. User starts mock mode from predicted list or ad-hoc.
2. App presents **one question at a time** in professional interviewer tone.
3. User submits answer (text in MVP; voice optional later).
4. App may ask **dynamic follow-ups** based on the answer (behavioral drill-down, clarification, objection).
5. User can tap **"Push harder"** for a tougher follow-up at any point.
6. Repeat until all selected questions are covered or user ends session.
7. App saves full Q&A transcript and routes to evaluation (per-answer or batch).

*Voice input is P2; text-only in MVP.

### Flow 3: Answer Evaluation

```
Mock Session (or single answer) → Evaluate → Scores + Feedback → Coaching Controls
  → [Regenerate / Adjust tone / Show sample answer] → Export or Continue practicing
```

**Steps:**
1. After each answer (or on demand at session end), app runs evaluation checks.
2. App displays per-dimension scores (clarity, structure, relevance, confidence, specificity, impact).
3. App surfaces weak spots, red flags, and specific phrasing suggestions.
4. User adjusts feedback controls (tone, depth, focus areas) and can regenerate feedback.
5. User optionally reveals an improved sample answer draft.
6. User exports session (PDF/markdown) or returns to mock for another round.

---

## C. Inputs

| Field name | Type | Required | Validation | Where used |
|------------|------|----------|------------|------------|
| `target_company_or_school` | string | **Required** | 1–200 chars; non-empty | Question prediction, relevance checks, rationale |
| `target_role_or_program` | string | **Required** | 1–200 chars; non-empty | Question prediction, relevance checks |
| `interview_type` | enum | **Required** | One of: `behavioral`, `technical`, `case`, `admissions`, `panel`, `mixed`, `other` | Question style, evaluation rubric, follow-up behavior |
| `resume_text` | text / file | **Required** | Min 100 chars if text; PDF/DOCX/TXT if file; max 10 MB | Background analysis, resume-based questions, red-flag cross-check |
| `job_or_program_description` | text / file | Optional | Max 20,000 chars or 10 MB file | Question prediction, relevance scoring |
| `cover_letter_text` | text / file | Optional | Max 10,000 chars | Positioning analysis, motivation questions |
| `linkedin_summary` | text | Optional | Max 5,000 chars | Background analysis, consistency checks |
| `personal_statement` | text | Optional | Max 10,000 chars | Admissions flow, motivation/goal questions |
| `specific_concerns` | text | Optional | Max 2,000 chars | Focus areas for feedback and question weighting |
| `session_name` | string | Optional | Max 100 chars; default auto-generated | Session list UI |
| `selected_question_ids` | string[] | Optional | Must reference valid question IDs | Mock interview queue |
| `answer_text` | text | **Required** (per answer) | Min 10 chars; max 10,000 chars | Evaluation, transcript |
| `feedback_tone` | enum | Optional | `direct`, `balanced`, `supportive`; default `balanced` | Feedback generation |
| `feedback_depth` | enum | Optional | `quick`, `standard`, `deep`; default `standard` | Feedback length and rewrite detail |
| `feedback_focus` | string[] | Optional | Subset of: `structure`, `storytelling`, `technical_depth`, `culture_fit` | Filters feedback emphasis |

**File upload notes (MVP):** Accept paste-as-text for all documents; optional file upload can parse PDF/DOCX server-side in v1.1.

---

## D. Prioritized Outputs

| Output | Priority | Description |
|--------|----------|-------------|
| **Predicted question list** with probability & importance scores | **P0** | Ranked list (e.g., 0–100 scores) tailored to user target and materials |
| **Question rationale** ("why likely") | **P0** | 1–3 sentences per question tying to JD, company patterns, resume gaps, or interview type |
| **Mock interview Q&A transcript** | **P0** | Ordered log: question, user answer, follow-ups, timestamps |
| **Per-answer evaluation scores** | **P0** | Numeric or letter grades across clarity, structure, relevance, confidence, specificity, impact |
| **Feedback and coaching notes** | **P0** | Actionable bullets: weak spots, missed opportunities, phrasing suggestions, likely objections |
| **Improved sample answer drafts** | **P1** | Rewritten answer preserving user voice; shown on demand |
| STAR method breakdown | P1 | Situation/Task/Action/Result tagging for behavioral answers |
| Session summary report | P1 | Aggregate strengths, top 3 improvements, questions to revisit |
| Interviewer objection predictions | P2 | "They might push back on…" per answer |
| Comparative progress across sessions | P2 | Trend charts for scores over time |
| Voice playback / transcription | P2 | Audio mock interview support |

---

## E. Evidence

Each output must cite or implicitly ground in these evidence sources:

| Evidence source | Backs which outputs |
|-----------------|---------------------|
| **User-provided materials** (resume, cover letter, LinkedIn, personal statement, JD) | Question list, rationale, resume-based questions, relevance scores, red-flag detection |
| **Inferred patterns** (company/school/role/industry heuristics) | Question probability scores, culture-fit prompts, admissions themes |
| **Interview best practices** (STAR, specificity, concise hooks, case/interview frameworks) | Evaluation checks, structure feedback, sample answers |
| **Session history within app** (prior answers, scores, flagged weak spots) | Follow-up difficulty, progress trends, "don't repeat this mistake" coaching |

**UI requirement:** Evaluation panel should show a short **"Based on"** line (e.g., "Resume: Project X · JD: leadership requirement · Behavioral/STAR").

---

## F. Evaluation Checks

Automated/heuristic checks the app runs on each answer (and optionally at session level):

| Check | Applies to | Logic (heuristic) |
|-------|------------|-------------------|
| **STAR completeness** | Behavioral | Detect Situation, Task, Action, Result segments; flag missing elements |
| **Specificity** | All | Score presence of metrics, names, timelines, outcomes; flag vague words ("various", "helped", "many") |
| **Structure** | All | Check for hook/opening, context, action, result/close; penalize wall-of-text |
| **Relevance to target** | All | Keyword/semantic overlap with JD, role, company values; flag off-topic tangents |
| **Confidence markers** | All | Detect hedging ("I think", "maybe", "kind of"), excessive filler, upspeak patterns |
| **Red flags** | All | Vague claims, unsupported superlatives, contradictions with resume, negative framing without recovery |
| **Length appropriateness** | All | Flag answers < 30 sec equivalent (~75 words) or > 3 min (~450 words) unless case/technical |
| **Technical reasoning** | Technical/case | Notes clarifying questions asked, structured approach, tradeoffs (process > memorized answer) |
| **Admissions alignment** | Admissions | Motivation, self-awareness, fit with institution, long-term goals |

**Output format:** Each check returns `pass | warn | fail` plus a one-line explanation. Aggregate into dimension scores for D.

---

## G. Feedback Controls

UI/UX controls for coaching interaction:

| Control | Type | Behavior |
|---------|------|----------|
| **Tone** | Slider or 3 presets | `Direct` ↔ `Supportive`; adjusts phrasing of feedback (no empty flattery) |
| **Depth** | Segmented control | `Quick tips` (3 bullets) / `Standard` / `Deep rewrite` (paragraph-level) |
| **Focus area toggles** | Multi-select chips | `Structure`, `Storytelling`, `Technical depth`, `Culture fit` — filters feedback |
| **"Push harder"** | Button (during mock) | Generates realistic interviewer follow-up or objection |
| **Show/hide sample answer** | Toggle | Reveals improved draft (P1); default hidden to avoid anchoring |
| **Regenerate feedback** | Button | Re-runs evaluation with current control settings |
| **Export session** | Button | Download PDF or Markdown: transcript + scores + feedback |

**Behavioral rules (system prompt level):**
- No generic encouragement without substance
- Honest, constructive, practical
- Realistic follow-ups; identify likely objections
- Preserve user's authentic voice in sample answers

---

## H. Screen Map

| # | View | Purpose |
|---|------|---------|
| 1 | **Landing / Home** | Value prop, start new session, resume past sessions |
| 2 | **Session List** | Past sessions with target, date, status |
| 3 | **Intake** | Multi-step or single-page form for materials + target |
| 4 | **Analysis Loading** | Progress state while AI analyzes (skeleton UI) |
| 5 | **Predicted Questions** | Ranked list, scores, rationale, select for mock |
| 6 | **Mock Interview** | One question, answer input, follow-up thread, push harder |
| 7 | **Evaluation Panel** | Scores, checks, feedback, coaching controls (side panel or below answer) |
| 8 | **Session Summary** | Full transcript, aggregate scores, export |
| 9 | **Settings** (optional MVP) | Default tone/depth, API key if BYOK later |

**MVP minimum screens:** 1, 3, 4, 5, 6, 7, 8 (Session List can be simplified to "Recent" on Home).

---

## I. Data Model

### User
- `id`, `email` (optional anon), `created_at`
- `default_feedback_tone`, `default_feedback_depth`

### Session
- `id`, `user_id`, `name`, `status` (`intake | analyzing | ready | interviewing | completed`)
- `target_company_or_school`, `target_role_or_program`, `interview_type`
- `specific_concerns`, `created_at`, `updated_at`
- Relations: `materials`, `questions`, `answers`

### Material (user uploads / paste)
- `id`, `session_id`, `type` (`resume | cover_letter | linkedin | personal_statement | job_description`)
- `content_text`, `file_url` (optional), `created_at`

### Question
- `id`, `session_id`, `text`, `source` (`predicted | follow_up | manual`)
- `probability_score`, `importance_score`, `rationale`
- `order_index`, `parent_question_id` (nullable, for follow-ups)

### Answer
- `id`, `question_id`, `session_id`, `content_text`
- `answered_at`, `duration_seconds` (optional)

### Evaluation
- `id`, `answer_id`
- `scores` (JSON: clarity, structure, relevance, confidence, specificity, impact — each 0–100)
- `checks` (JSON: array of `{ name, status, message }`)
- `created_at`

### Feedback
- `id`, `evaluation_id`
- `tone`, `depth`, `focus_areas` (JSON array)
- `coaching_notes` (text/markdown)
- `sample_answer` (text, nullable)
- `version` (increment on regenerate)

**ER sketch:**
```
User 1──* Session 1──* Material
              ├──* Question 1──* Answer 1──1 Evaluation 1──* Feedback
              └──* Question (follow-ups via parent_question_id)
```

---

## J. API Sketch

Pseudo-REST; prefix `/api/v1`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/sessions` | Create session (intake metadata) |
| `GET` | `/sessions` | List user sessions |
| `GET` | `/sessions/:id` | Session detail + materials + questions |
| `PATCH` | `/sessions/:id` | Update intake fields |
| `POST` | `/sessions/:id/materials` | Add/update pasted or uploaded material |
| `POST` | `/sessions/:id/analyze` | Trigger background analysis → predicted questions |
| `GET` | `/sessions/:id/questions` | Get predicted questions (poll if analyzing) |
| `PATCH` | `/sessions/:id/questions` | Reorder / select questions for mock |
| `POST` | `/sessions/:id/mock/start` | Set status to interviewing; return first question |
| `POST` | `/sessions/:id/mock/next` | Submit answer; returns evaluation + next question or follow-up |
| `POST` | `/answers/:id/push-harder` | Generate follow-up question for current thread |
| `POST` | `/answers/:id/evaluate` | Run/re-run evaluation with feedback params |
| `POST` | `/evaluations/:id/feedback` | Generate feedback (`tone`, `depth`, `focus_areas`) |
| `POST` | `/evaluations/:id/regenerate` | Regenerate feedback with new controls |
| `GET` | `/sessions/:id/export?format=md\|pdf` | Export transcript + evaluations |

**AI calls:** Implement as server-side functions invoked by `analyze`, `mock/next`, `evaluate`, and `feedback`—single LLM provider with structured JSON outputs for scores and checks.

---

## K. MVP Scope

### v1 (MVP)
- Anonymous or simple email auth (local dev can skip auth)
- Intake form with paste-text for all materials
- AI analysis → predicted questions with scores + rationale
- Mock interview: one question at a time, text answers, basic follow-ups
- Per-answer evaluation with core checks (STAR, specificity, structure, relevance, confidence, red flags)
- Feedback with tone/depth presets and regenerate
- Session transcript view + markdown export
- SQLite persistence, single-user local deploy

### v1.1
- PDF/DOCX upload parsing
- Show/hide sample answer drafts
- "Push harder" follow-up button
- Session list with resume

### v2+
- PDF export, auth accounts, progress across sessions
- Voice input, panel interview simulation
- Company/school pattern library (curated or cached research)
- BYOK for LLM API keys

---

## L. Tech Stack Recommendation

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | Next.js 14+ (App Router) | Full-stack in one repo; easy deploy on Vercel; good for student iteration in Cursor |
| **Language** | TypeScript | Type safety for data model and API contracts |
| **Database** | SQLite via Drizzle ORM | Zero-config local dev; file-based; easy migration to Postgres later |
| **AI** | OpenAI or Anthropic API (server actions/route handlers) | Structured outputs for scores/checks; swap models via env var |
| **UI** | Tailwind CSS + shadcn/ui | Fast, consistent components (forms, sliders, cards) |
| **Validation** | Zod | Shared schemas for forms and API |
| **Export** | `react-markdown` + simple MD template; PDF via `@react-pdf/renderer` or html-to-pdf in v1.1 |

**Suggested repo layout:**
```
/app          → pages and route handlers
/components   → IntakeForm, QuestionList, MockInterview, EvaluationPanel
/lib          → ai/, db/, evaluations/checks.ts
/drizzle      → schema and migrations
```

**Why not over-engineer:** No microservices, no queue worker for MVP (sync AI calls with loading UI; add background jobs only if analyze times out). One monolith Next app is enough until multi-user scale.

---

## Appendix: AI Prompt Modules (implementation hint)

Split system logic into composable prompts:
1. **Intake analyzer** — strengths, weaknesses, positioning from materials
2. **Question predictor** — tailored questions + rationale + scores
3. **Interviewer persona** — realistic mock, dynamic follow-ups
4. **Evaluator** — run checks F, return structured JSON scores
5. **Coach** — feedback + sample answer respecting tone/depth/focus controls

Each module receives: session context, materials summary, interview type, and (where relevant) prior Q&A in session.

---

## M. Platform Features (v1.1 — implemented)

### Target users
- Students / interns
- MBA applicants
- Consulting candidates
- Software engineering candidates
- Career switchers
- Experienced professionals

Captured via `userPersona` on intake; influences default interview type and question prediction hints.

### Industry-aware prediction
- `targetIndustry` field on intake (consulting, technology, finance, etc.)
- Question predictor weights industry patterns alongside company/school/role

### Structured scoring rubrics
Interview-type-specific rubrics in `lib/evaluations/rubrics.ts`:

| Interview type | Rubric dimensions |
|----------------|-------------------|
| Behavioral | STAR structure, specificity & impact, ownership, relevance, delivery |
| Technical | Problem framing, structured approach, technical depth, communication, edge cases |
| Case | Hypothesis & structure, quantitative reasoning, business insight, synthesis, exec communication |
| Admissions | Motivation & fit, self-awareness, leadership & impact, goals, authenticity |

Each answer stores `rubricScores` JSON alongside legacy dimension scores.

### Coaching dashboard
Route: `/sessions/:id/dashboard`

Displays:
- Overall score (rubric-weighted)
- Dimension averages (clarity, structure, relevance, confidence, specificity, impact)
- Rubric breakdown by interview type
- Priority improvements (recurring weak checks)
- Coaching action plan
- Answer history table

API: `GET /api/v1/sessions/:id/dashboard`

### Voice interview simulation
- Toggle text/voice mode on mock interview page
- Browser Web Speech API transcription (`components/VoiceRecorder.tsx`)
- Answers stored with `answerMode: text | voice` and optional `durationSeconds`
- Transcript editable before submit; evaluated with same rubrics

**Browser support:** Chrome, Edge (Web Speech API). Fallback message on unsupported browsers.

### Screen map update

| # | View | Purpose |
|---|------|---------|
| 10 | **Coaching Dashboard** | Structured scores, rubrics, improvements, action plan |

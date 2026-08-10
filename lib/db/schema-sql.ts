export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT,
    default_feedback_tone TEXT DEFAULT 'balanced',
    default_feedback_depth TEXT DEFAULT 'standard',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    name TEXT,
    status TEXT NOT NULL DEFAULT 'intake',
    target_company_or_school TEXT NOT NULL,
    target_role_or_program TEXT NOT NULL,
    interview_type TEXT NOT NULL,
    specific_concerns TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    content_text TEXT NOT NULL,
    file_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'predicted',
    probability_score INTEGER,
    importance_score INTEGER,
    rationale TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    parent_question_id TEXT,
    selected INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS answers (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    content_text TEXT NOT NULL,
    answered_at TEXT NOT NULL DEFAULT (datetime('now')),
    duration_seconds INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS evaluations (
    id TEXT PRIMARY KEY,
    answer_id TEXT NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
    scores TEXT NOT NULL,
    checks TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    tone TEXT NOT NULL DEFAULT 'balanced',
    depth TEXT NOT NULL DEFAULT 'standard',
    focus_areas TEXT NOT NULL,
    coaching_notes TEXT NOT NULL,
    sample_answer TEXT,
    version INTEGER NOT NULL DEFAULT 1
  )`,
];

export const MIGRATION_COLUMNS = [
  { table: "sessions", column: "target_industry", definition: "TEXT" },
  { table: "sessions", column: "user_persona", definition: "TEXT" },
  { table: "answers", column: "answer_mode", definition: "TEXT DEFAULT 'text'" },
  { table: "evaluations", column: "rubric_scores", definition: "TEXT" },
] as const;

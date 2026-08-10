import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  defaultFeedbackTone: text("default_feedback_tone").default("balanced"),
  defaultFeedbackDepth: text("default_feedback_depth").default("standard"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  name: text("name"),
  status: text("status", {
    enum: ["intake", "analyzing", "ready", "interviewing", "completed"],
  })
    .notNull()
    .default("intake"),
  targetCompanyOrSchool: text("target_company_or_school").notNull(),
  targetRoleOrProgram: text("target_role_or_program").notNull(),
  interviewType: text("interview_type", {
    enum: [
      "behavioral",
      "technical",
      "case",
      "admissions",
      "panel",
      "mixed",
      "other",
    ],
  }).notNull(),
  targetIndustry: text("target_industry"),
  userPersona: text("user_persona", {
    enum: [
      "student",
      "mba_applicant",
      "consulting",
      "software_engineering",
      "career_switcher",
      "experienced_professional",
    ],
  }),
  specificConcerns: text("specific_concerns"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const materials = sqliteTable("materials", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: [
      "resume",
      "cover_letter",
      "linkedin",
      "personal_statement",
      "job_description",
    ],
  }).notNull(),
  contentText: text("content_text").notNull(),
  fileUrl: text("file_url"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  source: text("source", {
    enum: ["predicted", "follow_up", "manual"],
  })
    .notNull()
    .default("predicted"),
  probabilityScore: integer("probability_score"),
  importanceScore: integer("importance_score"),
  rationale: text("rationale"),
  orderIndex: integer("order_index").notNull().default(0),
  parentQuestionId: text("parent_question_id"),
  selected: integer("selected", { mode: "boolean" }).notNull().default(true),
});

export const answers = sqliteTable("answers", {
  id: text("id").primaryKey(),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  contentText: text("content_text").notNull(),
  answerMode: text("answer_mode", { enum: ["text", "voice"] })
    .notNull()
    .default("text"),
  answeredAt: text("answered_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  durationSeconds: integer("duration_seconds"),
});

export const evaluations = sqliteTable("evaluations", {
  id: text("id").primaryKey(),
  answerId: text("answer_id")
    .notNull()
    .references(() => answers.id, { onDelete: "cascade" }),
  scores: text("scores", { mode: "json" }).notNull().$type<EvaluationScores>(),
  rubricScores: text("rubric_scores", { mode: "json" }).$type<RubricScores>(),
  checks: text("checks", { mode: "json" }).notNull().$type<EvaluationCheck[]>(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const feedback = sqliteTable("feedback", {
  id: text("id").primaryKey(),
  evaluationId: text("evaluation_id")
    .notNull()
    .references(() => evaluations.id, { onDelete: "cascade" }),
  tone: text("tone").notNull().default("balanced"),
  depth: text("depth").notNull().default("standard"),
  focusAreas: text("focus_areas", { mode: "json" })
    .notNull()
    .$type<string[]>(),
  coachingNotes: text("coaching_notes").notNull(),
  sampleAnswer: text("sample_answer"),
  version: integer("version").notNull().default(1),
});

export type EvaluationScores = {
  clarity: number;
  structure: number;
  relevance: number;
  confidence: number;
  specificity: number;
  impact: number;
};

export type RubricDimensionScore = {
  id: string;
  name: string;
  description: string;
  weight: number;
  score: number;
  feedback: string;
};

export type RubricScores = {
  interviewType: string;
  overall: number;
  dimensions: RubricDimensionScore[];
};

export type EvaluationCheck = {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
};

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  materials: many(materials),
  questions: many(questions),
  answers: many(answers),
}));

export const materialsRelations = relations(materials, ({ one }) => ({
  session: one(sessions, {
    fields: [materials.sessionId],
    references: [sessions.id],
  }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  session: one(sessions, {
    fields: [questions.sessionId],
    references: [sessions.id],
  }),
  parentQuestion: one(questions, {
    fields: [questions.parentQuestionId],
    references: [questions.id],
  }),
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one, many }) => ({
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
  session: one(sessions, {
    fields: [answers.sessionId],
    references: [sessions.id],
  }),
  evaluations: many(evaluations),
}));

export const evaluationsRelations = relations(evaluations, ({ one, many }) => ({
  answer: one(answers, {
    fields: [evaluations.answerId],
    references: [answers.id],
  }),
  feedbackItems: many(feedback),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  evaluation: one(evaluations, {
    fields: [feedback.evaluationId],
    references: [evaluations.id],
  }),
}));

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
  actionPlans: many(actionPlans),
  debriefs: many(interviewDebriefs),
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

export type ActionPlanCategory =
  | "behavior"
  | "technical"
  | "communication"
  | "preparation"
  | "mindset"
  | "other";

export type ActionPlanStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "skipped";

export type ActionPlanSource = "coaching" | "manual" | "insight";

export const actionPlans = sqliteTable("action_plans", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").references(() => sessions.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").$type<ActionPlanCategory>().default("other"),
  priority: text("priority", { enum: ["high", "medium", "low"] }).default(
    "medium",
  ),
  status: text("status").$type<ActionPlanStatus>().default("pending"),
  source: text("source").$type<ActionPlanSource>().default("manual"),
  dueDate: text("due_date"),
  completedAt: text("completed_at"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type InterviewOutcome =
  | "pending"
  | "passed"
  | "rejected"
  | "offer"
  | "withdrawn"
  | "ongoing";

export const interviewDebriefs = sqliteTable("interview_debriefs", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  interviewDate: text("interview_date"),
  outcome: text("outcome").$type<InterviewOutcome>().default("ongoing"),
  howItWent: text("how_it_went").notNull(),
  questionAccuracyRating: integer("question_accuracy_rating"),
  questionsAsked: text("questions_asked", { mode: "json" }).$type<string[]>(),
  questionsWeMissed: text("questions_we_missed", { mode: "json" }).$type<
    string[]
  >(),
  unexpectedDifficulties: text("unexpected_difficulties"),
  whatWentWell: text("what_went_well"),
  whatToImprove: text("what_to_improve"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type BehaviorTrend = "improving" | "stable" | "needs_attention";

export type LearningInsights = {
  summary: string;
  behaviorPatterns: {
    pattern: string;
    evidence: string;
    trend: BehaviorTrend;
  }[];
  improvementAreas: {
    area: string;
    priority: "high" | "medium" | "low";
    recommendation: string;
    sessionsAffected: number;
  }[];
  longTermActionPlan: {
    goal: string;
    milestones: string[];
    timeframe: string;
  }[];
  predictionAccuracy: {
    averageRating: number | null;
    trend: string;
    notes: string;
  };
  strengths: string[];
};

export const learningSnapshots = sqliteTable("learning_snapshots", {
  id: text("id").primaryKey(),
  insights: text("insights", { mode: "json" })
    .notNull()
    .$type<LearningInsights>(),
  sessionCount: integer("session_count").notNull(),
  debriefCount: integer("debrief_count").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const actionPlansRelations = relations(actionPlans, ({ one }) => ({
  session: one(sessions, {
    fields: [actionPlans.sessionId],
    references: [sessions.id],
  }),
}));

export const interviewDebriefsRelations = relations(
  interviewDebriefs,
  ({ one }) => ({
    session: one(sessions, {
      fields: [interviewDebriefs.sessionId],
      references: [sessions.id],
    }),
  }),
);

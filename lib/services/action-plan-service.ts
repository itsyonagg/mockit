import { eq } from "drizzle-orm";
import { actionPlans } from "@/drizzle/schema";
import { getDb } from "@/lib/db";
import { getSessionDashboard } from "@/lib/services/session-service";
import { createId } from "@/lib/utils";
import type {
  CreateActionPlanInput,
  UpdateActionPlanInput,
} from "@/lib/validations/learning";

let initialized = false;

async function ensureDb() {
  if (!initialized) {
    await getDb();
    initialized = true;
  }
  return getDb();
}

function parseCoachingAction(action: string) {
  const match = action.match(/^\[(HIGH|MEDIUM|LOW)\]\s+([^:]+):\s*(.+)$/i);
  if (match) {
    return {
      priority: match[1]!.toLowerCase() as "high" | "medium" | "low",
      title: match[2]!.trim(),
      description: match[3]!.trim(),
    };
  }
  return {
    priority: "medium" as const,
    title: action.slice(0, 120),
    description: action,
  };
}

export async function listActionPlans(sessionId?: string) {
  const db = await ensureDb();
  if (sessionId) {
    return db.query.actionPlans.findMany({
      where: eq(actionPlans.sessionId, sessionId),
      orderBy: (p, { desc: d }) => [d(p.updatedAt)],
    });
  }
  return db.query.actionPlans.findMany({
    orderBy: (p, { desc: d }) => [d(p.updatedAt)],
    with: { session: true },
  });
}

export async function createActionPlan(
  sessionId: string,
  input: CreateActionPlanInput,
) {
  const db = await ensureDb();
  const id = createId("ap");
  const now = new Date().toISOString();

  await db.insert(actionPlans).values({
    id,
    sessionId,
    title: input.title,
    description: input.description,
    category: input.category ?? "other",
    priority: input.priority ?? "medium",
    status: "pending",
    source: input.source ?? "manual",
    dueDate: input.dueDate,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  });

  return db.query.actionPlans.findFirst({ where: eq(actionPlans.id, id) });
}

export async function updateActionPlan(
  planId: string,
  input: UpdateActionPlanInput,
) {
  const db = await ensureDb();
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { ...input, updatedAt: now };

  if (input.status === "completed") {
    updates.completedAt = now;
  }

  await db.update(actionPlans).set(updates).where(eq(actionPlans.id, planId));
  return db.query.actionPlans.findFirst({ where: eq(actionPlans.id, planId) });
}

export async function syncActionPlansFromDashboard(sessionId: string) {
  const db = await ensureDb();
  const existing = await db.query.actionPlans.findMany({
    where: eq(actionPlans.sessionId, sessionId),
  });
  const coachingExisting = existing.filter((p) => p.source === "coaching");
  if (coachingExisting.length > 0) {
    return coachingExisting;
  }

  const dashboard = await getSessionDashboard(sessionId);
  const created = [];

  for (const action of dashboard.coachingActions) {
    if (action.includes("Complete at least one mock interview")) continue;
    const parsed = parseCoachingAction(action);
    const plan = await createActionPlan(sessionId, {
      ...parsed,
      source: "coaching",
      category: "other",
    });
    if (plan) created.push(plan);
  }

  return created;
}

export async function getActionPlanStats() {
  const db = await ensureDb();
  const plans = await db.query.actionPlans.findMany();
  return {
    total: plans.length,
    completed: plans.filter((p) => p.status === "completed").length,
    inProgress: plans.filter((p) => p.status === "in_progress").length,
    pending: plans.filter((p) => p.status === "pending").length,
  };
}

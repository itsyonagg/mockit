"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ActionPlanStatus } from "@/drizzle/schema";

type ActionPlan = {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  status: ActionPlanStatus | null;
  category: string | null;
  source: string | null;
  dueDate: string | null;
  notes: string | null;
};

const STATUS_OPTIONS: { value: ActionPlanStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "skipped", label: "Skipped" },
];

export function ActionPlanTracker({
  sessionId,
  initialPlans,
  showSync = true,
}: {
  sessionId: string;
  initialPlans: ActionPlan[];
  showSync?: boolean;
}) {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [loading, setLoading] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function syncFromDashboard() {
    setLoading("sync");
    setError(null);
    try {
      const res = await fetch(`/api/v1/sessions/${sessionId}/action-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncFromDashboard: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlans(data.actionPlans);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setLoading(null);
    }
  }

  async function updateStatus(planId: string, status: ActionPlanStatus) {
    setLoading(planId);
    setError(null);
    try {
      const res = await fetch(`/api/v1/action-plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, status } : p)),
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(null);
    }
  }

  async function addPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setLoading("add");
    setError(null);
    try {
      const res = await fetch(`/api/v1/sessions/${sessionId}/action-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), source: "manual" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlans((prev) => [data.actionPlan, ...prev]);
      setNewTitle("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add plan");
    } finally {
      setLoading(null);
    }
  }

  const completed = plans.filter((p) => p.status === "completed").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Action plan tracker</h1>
          <p className="mt-1 text-sm text-gray-500">
            {completed}/{plans.length} completed — track coaching items across
            practice and real interviews.
          </p>
        </div>
        {showSync && (
          <button
            type="button"
            className="btn-secondary"
            onClick={syncFromDashboard}
            disabled={loading === "sync"}
          >
            {loading === "sync" ? "Syncing..." : "Import from dashboard"}
          </button>
        )}
      </div>

      <form onSubmit={addPlan} className="card flex flex-wrap gap-3">
        <input
          className="input-field flex-1"
          placeholder="Add a custom action item..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={loading === "add"}>
          Add
        </button>
      </form>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {plans.length === 0 ? (
        <div className="card text-center text-gray-500">
          <p>No action items yet.</p>
          <p className="mt-2 text-sm">
            Complete a mock interview, then import coaching actions from your
            dashboard.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {plans.map((plan) => (
            <li key={plan.id} className="card flex flex-wrap items-start gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-gray-900">{plan.title}</p>
                  {plan.priority && (
                    <span
                      className={`rounded px-2 py-0.5 text-xs uppercase ${
                        plan.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : plan.priority === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {plan.priority}
                    </span>
                  )}
                  {plan.source === "coaching" && (
                    <span className="rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                      from coaching
                    </span>
                  )}
                </div>
                {plan.description && (
                  <p className="mt-1 text-sm text-gray-600">{plan.description}</p>
                )}
              </div>
              <select
                className="input-field w-auto min-w-[140px]"
                value={plan.status ?? "pending"}
                disabled={loading === plan.id}
                onChange={(e) =>
                  updateStatus(plan.id, e.target.value as ActionPlanStatus)
                }
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

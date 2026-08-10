"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LearningInsights } from "@/drizzle/schema";

const TREND_COLORS = {
  improving: "bg-green-100 text-green-800",
  stable: "bg-blue-100 text-blue-800",
  needs_attention: "bg-amber-100 text-amber-800",
};

export function LearningInsightsPanel({
  initialInsights,
  generatedAt,
  cached,
  stats,
}: {
  initialInsights: LearningInsights;
  generatedAt: string;
  cached: boolean;
  stats: {
    sessions: number;
    debriefs: number;
    actionPlans: number;
    completedPlans: number;
    averageAccuracy: number | null;
  };
}) {
  const router = useRouter();
  const [insights, setInsights] = useState(initialInsights);
  const [meta, setMeta] = useState({ generatedAt, cached });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function regenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/learning/insights", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInsights(data.insights);
      setMeta({ generatedAt: data.generatedAt, cached: data.cached });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh insights");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Your progress & insights</h1>
          <p className="mt-1 text-gray-600">
            MockIt learns from your mock sessions, debriefs, and action plans over
            time.
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Last updated {new Date(meta.generatedAt).toLocaleString()}
            {meta.cached ? " (cached)" : ""}
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={regenerate}
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Refresh insights"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Practice sessions", value: stats.sessions },
          { label: "Interview debriefs", value: stats.debriefs },
          {
            label: "Action plans done",
            value: `${stats.completedPlans}/${stats.actionPlans}`,
          },
          {
            label: "Prediction accuracy",
            value:
              stats.averageAccuracy != null
                ? `${stats.averageAccuracy.toFixed(1)}/5`
                : "—",
          },
        ].map((item) => (
          <div key={item.label} className="card text-center">
            <p className="text-xs uppercase text-gray-400">{item.label}</p>
            <p className="mt-1 text-2xl font-bold text-brand-700">{item.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <section className="card">
        <h2 className="font-semibold">Summary</h2>
        <p className="mt-2 text-gray-700">{insights.summary}</p>
      </section>

      {insights.strengths.length > 0 && (
        <section className="card">
          <h2 className="mb-3 font-semibold">Strengths</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
            {insights.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2 className="mb-4 font-semibold">Behavior patterns</h2>
        {insights.behaviorPatterns.length === 0 ? (
          <p className="text-sm text-gray-500">
            Log more debriefs to surface recurring behavior patterns.
          </p>
        ) : (
          <ul className="space-y-3">
            {insights.behaviorPatterns.map((item, i) => (
              <li key={i} className="rounded-lg border border-gray-100 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.pattern}</p>
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${TREND_COLORS[item.trend]}`}
                  >
                    {item.trend.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{item.evidence}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="mb-4 font-semibold">Improvement areas</h2>
        {insights.improvementAreas.length === 0 ? (
          <p className="text-sm text-gray-500">Complete mock interviews to identify areas.</p>
        ) : (
          <ul className="space-y-3">
            {insights.improvementAreas.map((item, i) => (
              <li key={i} className="flex gap-3 rounded-lg border border-gray-100 p-3">
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium uppercase ${
                    item.priority === "high"
                      ? "bg-red-100 text-red-700"
                      : item.priority === "medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {item.priority}
                </span>
                <div>
                  <p className="font-medium">{item.area}</p>
                  <p className="text-sm text-gray-600">{item.recommendation}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Seen across {item.sessionsAffected} session
                    {item.sessionsAffected === 1 ? "" : "s"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="mb-4 font-semibold">Long-term action plan</h2>
        {insights.longTermActionPlan.length === 0 ? (
          <p className="text-sm text-gray-500">
            Insights will suggest multi-week goals as you accumulate data.
          </p>
        ) : (
          <div className="space-y-4">
            {insights.longTermActionPlan.map((plan, i) => (
              <div key={i} className="rounded-lg border border-gray-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{plan.goal}</p>
                  <span className="text-xs text-gray-400">{plan.timeframe}</span>
                </div>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-600">
                  {plan.milestones.map((m, j) => (
                    <li key={j}>{m}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="mb-2 font-semibold">Question prediction accuracy</h2>
        <p className="text-sm text-gray-600">{insights.predictionAccuracy.notes}</p>
        <p className="mt-2 text-sm">
          <span className="font-medium">Trend: </span>
          {insights.predictionAccuracy.trend}
        </p>
      </section>
    </div>
  );
}

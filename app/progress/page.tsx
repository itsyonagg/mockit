import Link from "next/link";
import { LearningInsightsPanel } from "@/components/LearningInsightsPanel";
import { listActionPlans } from "@/lib/services/action-plan-service";
import {
  generateAndSaveInsights,
  getProgressOverview,
} from "@/lib/services/learning-service";
import { OUTCOME_LABELS } from "@/lib/validations/learning";
import { formatDate } from "@/lib/utils";

export default async function ProgressPage() {
  const overview = await getProgressOverview();
  const { insights, generatedAt, cached } = await generateAndSaveInsights(false);
  const allPlans = await listActionPlans();

  return (
    <div className="space-y-10">
      <LearningInsightsPanel
        initialInsights={insights}
        generatedAt={generatedAt}
        cached={cached}
        stats={overview.stats}
      />

      <section className="card">
        <h2 className="mb-4 font-semibold">Recent interview debriefs</h2>
        {overview.recentDebriefs.length === 0 ? (
          <p className="text-sm text-gray-500">
            After a real interview, log a debrief from any session&apos;s dashboard
            to help MockIt learn.
          </p>
        ) : (
          <ul className="space-y-3">
            {overview.recentDebriefs.map((d) => (
              <li key={d.id} className="rounded-lg border border-gray-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{d.session?.name ?? "Session"}</p>
                    <p className="text-sm text-gray-500">
                      {d.outcome ? OUTCOME_LABELS[d.outcome] : "—"} ·{" "}
                      {d.questionAccuracyRating != null
                        ? `${d.questionAccuracyRating}/5 accuracy`
                        : "No rating"}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDate(d.updatedAt)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                  {d.howItWent}
                </p>
                {d.session && (
                  <Link
                    href={`/sessions/${d.sessionId}/debrief`}
                    className="mt-2 inline-block text-sm text-brand-600 hover:underline"
                  >
                    Edit debrief
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="mb-4 font-semibold">All action plans</h2>
        {allPlans.length === 0 ? (
          <p className="text-sm text-gray-500">
            Import coaching actions from a session dashboard to start tracking.
          </p>
        ) : (
          <ul className="space-y-2">
            {allPlans.slice(0, 12).map((plan) => (
              <li
                key={plan.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-50 px-3 py-2 text-sm"
              >
                <span className="text-gray-800">{plan.title}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      plan.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : plan.status === "in_progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {plan.status?.replace("_", " ")}
                  </span>
                  {plan.sessionId && (
                    <Link
                      href={`/sessions/${plan.sessionId}/action-plans`}
                      className="text-brand-600 hover:underline"
                    >
                      View
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

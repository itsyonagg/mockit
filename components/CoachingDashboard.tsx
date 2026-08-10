import Link from "next/link";
import type { DashboardData } from "@/lib/evaluations/dashboard";
import {
  INDUSTRY_LABELS,
  PERSONA_LABELS,
  type Industry,
  type UserPersona,
} from "@/lib/constants/personas";
import { INTERVIEW_TYPE_LABELS } from "@/lib/validations/session";

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 75 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="capitalize text-gray-700">{label}</span>
        <span className="font-medium">{score}/100</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
    </div>
  );
}

export function CoachingDashboard({
  data,
  sessionId,
}: {
  data: DashboardData;
  sessionId: string;
}) {
  const personaLabel = data.persona
    ? PERSONA_LABELS[data.persona as UserPersona]
    : null;
  const industryLabel = data.industry
    ? INDUSTRY_LABELS[data.industry as Industry]
    : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Coaching dashboard</h1>
          <p className="mt-1 text-gray-600">{data.target}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-gray-100 px-2 py-1">
              {INTERVIEW_TYPE_LABELS[data.interviewType as keyof typeof INTERVIEW_TYPE_LABELS] ??
                data.interviewType}
            </span>
            {personaLabel && (
              <span className="rounded-full bg-brand-100 px-2 py-1 text-brand-800">
                {personaLabel}
              </span>
            )}
            {industryLabel && (
              <span className="rounded-full bg-gray-100 px-2 py-1">{industryLabel}</span>
            )}
          </div>
        </div>
        <div className="card min-w-[140px] text-center">
          <p className="text-xs uppercase text-gray-400">Overall score</p>
          <p className="text-4xl font-bold text-brand-700">{data.overallScore}</p>
          <p className="text-xs text-gray-500">
            {data.answersCompleted}/{data.questionsTotal} answered
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card space-y-4">
          <h2 className="font-semibold">Score dimensions</h2>
          {Object.entries(data.dimensionAverages).map(([key, score]) => (
            <ScoreBar key={key} label={key} score={score as number} />
          ))}
        </section>

        <section className="card space-y-4">
          <h2 className="font-semibold">Rubric breakdown</h2>
          {data.rubricAverages.length === 0 ? (
            <p className="text-sm text-gray-500">Complete a mock interview to see rubric scores.</p>
          ) : (
            data.rubricAverages.map((r) => (
              <ScoreBar key={r.id} label={r.name} score={r.score} />
            ))
          )}
        </section>
      </div>

      <section className="card">
        <h2 className="mb-4 font-semibold">Priority improvements</h2>
        {data.improvements.length === 0 ? (
          <p className="text-sm text-gray-500">No recurring issues yet — keep practicing.</p>
        ) : (
          <ul className="space-y-3">
            {data.improvements.map((item) => (
              <li
                key={item.area}
                className="flex gap-3 rounded-lg border border-gray-100 p-3"
              >
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
                  <p className="font-medium text-gray-900">{item.area}</p>
                  <p className="text-sm text-gray-600">{item.suggestion}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Flagged {item.occurrences}× in this session
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="mb-4 font-semibold">Coaching action plan</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
          {data.coachingActions.map((action, i) => (
            <li key={i}>{action}</li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-gray-500">
          Track these items over time and mark progress as you prepare for real
          interviews.
        </p>
        <Link
          href={`/sessions/${sessionId}/action-plans`}
          className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline"
        >
          Open action plan tracker →
        </Link>
      </section>

      <section className="card border-brand-100 bg-brand-50/30">
        <h2 className="mb-2 font-semibold">Had your real interview?</h2>
        <p className="text-sm text-gray-600">
          Log how it went, rate our question predictions, and note any surprises.
          MockIt uses this to learn your patterns and improve over time.
        </p>
        <Link
          href={`/sessions/${sessionId}/debrief`}
          className="btn-primary mt-4 inline-flex"
        >
          Log interview debrief
        </Link>
      </section>

      {data.recentScores.length > 0 && (
        <section className="card">
          <h2 className="mb-4 font-semibold">Answer history</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="pb-2 pr-4">Question</th>
                  <th className="pb-2 pr-4">Score</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentScores.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="max-w-md truncate py-2 pr-4">{row.question}</td>
                    <td className="py-2 pr-4 font-medium">{row.overall}</td>
                    <td className="py-2 text-gray-400">
                      {new Date(row.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href={`/sessions/${sessionId}/mock`} className="btn-primary">
          Continue mock interview
        </Link>
        <Link href={`/sessions/${sessionId}/mock?mode=voice`} className="btn-secondary">
          Voice practice
        </Link>
        <Link href={`/sessions/${sessionId}/summary`} className="btn-secondary">
          Full transcript
        </Link>
        <Link href="/progress" className="btn-secondary">
          Your progress
        </Link>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";

type Question = {
  id: string;
  text: string;
  probabilityScore: number | null;
  importanceScore: number | null;
  rationale: string | null;
  source: string;
};

export function QuestionList({
  sessionId,
  questions,
}: {
  sessionId: string;
  questions: Question[];
}) {
  const sorted = [...questions].sort((a, b) => {
    const scoreA = (a.probabilityScore ?? 0) + (a.importanceScore ?? 0);
    const scoreB = (b.probabilityScore ?? 0) + (b.importanceScore ?? 0);
    return scoreB - scoreA;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Predicted questions</h1>
          <p className="mt-1 text-gray-600">
            {questions.length} questions ranked by probability and importance
          </p>
        </div>
        <Link href={`/sessions/${sessionId}/mock`} className="btn-primary">
          Start mock interview
        </Link>
        <Link href={`/sessions/${sessionId}/dashboard`} className="btn-secondary">
          Dashboard
        </Link>
      </div>

      <ul className="space-y-4">
        {sorted.map((q, i) => (
          <li key={q.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="text-xs font-medium uppercase text-gray-400">
                  #{i + 1}
                  {q.source === "follow_up" ? " · Follow-up" : ""}
                </span>
                <p className="mt-1 font-medium text-gray-900">{q.text}</p>
                {q.rationale && (
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Why likely: </span>
                    {q.rationale}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right text-sm">
                <p className="text-brand-600">
                  {q.probabilityScore ?? "—"}% prob
                </p>
                <p className="text-gray-500">
                  {q.importanceScore ?? "—"}% importance
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

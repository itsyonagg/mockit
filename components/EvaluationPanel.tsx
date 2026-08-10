"use client";

import { useState } from "react";
import type { EvaluationCheck, EvaluationScores } from "@/drizzle/schema";

type RubricDimension = {
  id: string;
  name: string;
  score: number;
  feedback: string;
};

type FeedbackResult = {
  evaluation: {
    scores: EvaluationScores;
    checks: EvaluationCheck[];
    evidence: string;
    rubric?: { overall: number; dimensions: RubricDimension[] };
  };
  feedback: { coachingNotes: string; sampleAnswer?: string };
  nextQuestion: { id: string; text: string } | null;
  done: boolean;
};

export function EvaluationPanel({ result }: { result: FeedbackResult }) {
  const [showSample, setShowSample] = useState(false);
  const { evaluation, feedback } = result;

  return (
    <div className="card space-y-4 border-brand-100 bg-brand-50/30">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Structured evaluation</h3>
        {evaluation.rubric && (
          <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-800">
            {evaluation.rubric.overall}/100
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500">{evaluation.evidence}</p>

      {evaluation.rubric && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase text-gray-400">Rubric</p>
          {evaluation.rubric.dimensions.map((d) => (
            <div key={d.id} className="rounded-lg bg-white p-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{d.name}</span>
                <span className="text-brand-700">{d.score}/100</span>
              </div>
              <p className="mt-1 text-xs text-gray-600">{d.feedback}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Object.entries(evaluation.scores).map(([key, value]) => (
          <div key={key} className="rounded-lg bg-white px-3 py-2 text-center">
            <p className="text-xs capitalize text-gray-500">{key}</p>
            <p className="text-lg font-semibold text-brand-700">{value}</p>
          </div>
        ))}
      </div>

      <ul className="space-y-2 text-sm">
        {evaluation.checks.map((check) => (
          <li key={check.name} className="flex gap-2">
            <span
              className={
                check.status === "pass"
                  ? "text-green-600"
                  : check.status === "warn"
                    ? "text-amber-600"
                    : "text-red-600"
              }
            >
              {check.status === "pass" ? "✓" : check.status === "warn" ? "!" : "✗"}
            </span>
            <span>
              <strong>{check.name}:</strong> {check.message}
            </span>
          </li>
        ))}
      </ul>

      <div className="prose prose-sm max-w-none">
        <h4 className="font-medium text-gray-900">Coaching notes</h4>
        <div className="whitespace-pre-wrap text-sm text-gray-700">
          {feedback.coachingNotes}
        </div>
      </div>

      {feedback.sampleAnswer && (
        <div>
          <button
            type="button"
            onClick={() => setShowSample(!showSample)}
            className="btn-secondary text-xs"
          >
            {showSample ? "Hide" : "Show"} sample answer
          </button>
          {showSample && (
            <p className="mt-2 rounded-lg bg-white p-3 text-sm text-gray-700">
              {feedback.sampleAnswer}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InterviewOutcome } from "@/drizzle/schema";
import { OUTCOME_LABELS } from "@/lib/validations/learning";

type DebriefData = {
  interviewDate?: string | null;
  outcome?: InterviewOutcome | null;
  howItWent: string;
  questionAccuracyRating?: number | null;
  questionsAsked?: string[] | null;
  questionsWeMissed?: string[] | null;
  unexpectedDifficulties?: string | null;
  whatWentWell?: string | null;
  whatToImprove?: string | null;
};

export function InterviewDebriefForm({
  sessionId,
  sessionName,
  predictedQuestions,
  initialDebrief,
}: {
  sessionId: string;
  sessionName: string;
  predictedQuestions: string[];
  initialDebrief?: DebriefData | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [interviewDate, setInterviewDate] = useState(
    initialDebrief?.interviewDate ?? new Date().toISOString().split("T")[0],
  );
  const [outcome, setOutcome] = useState<InterviewOutcome>(
    initialDebrief?.outcome ?? "ongoing",
  );
  const [howItWent, setHowItWent] = useState(initialDebrief?.howItWent ?? "");
  const [questionAccuracyRating, setQuestionAccuracyRating] = useState(
    initialDebrief?.questionAccuracyRating ?? 3,
  );
  const [questionsAsked, setQuestionsAsked] = useState(
    (initialDebrief?.questionsAsked ?? []).join("\n"),
  );
  const [questionsWeMissed, setQuestionsWeMissed] = useState(
    (initialDebrief?.questionsWeMissed ?? []).join("\n"),
  );
  const [unexpectedDifficulties, setUnexpectedDifficulties] = useState(
    initialDebrief?.unexpectedDifficulties ?? "",
  );
  const [whatWentWell, setWhatWentWell] = useState(
    initialDebrief?.whatWentWell ?? "",
  );
  const [whatToImprove, setWhatToImprove] = useState(
    initialDebrief?.whatToImprove ?? "",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/v1/sessions/${sessionId}/debrief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewDate,
          outcome,
          howItWent,
          questionAccuracyRating,
          questionsAsked: questionsAsked
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          questionsWeMissed: questionsWeMissed
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          unexpectedDifficulties: unexpectedDifficulties || undefined,
          whatWentWell: whatWentWell || undefined,
          whatToImprove: whatToImprove || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save debrief");
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function addPredictedToAsked(q: string) {
    const lines = questionsAsked.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!lines.includes(q)) {
      setQuestionsAsked([...lines, q].join("\n"));
    }
  }

  function addPredictedToMissed(q: string) {
    const lines = questionsWeMissed.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!lines.includes(q)) {
      setQuestionsWeMissed([...lines, q].join("\n"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Interview debrief</h1>
        <p className="mt-1 text-gray-600">{sessionName}</p>
        <p className="mt-2 text-sm text-gray-500">
          Log how your real interview went so MockIt can learn your patterns and
          improve future question predictions and coaching.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="interviewDate">
              Interview date
            </label>
            <input
              id="interviewDate"
              type="date"
              className="input-field"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="outcome">
              Outcome
            </label>
            <select
              id="outcome"
              className="input-field"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as InterviewOutcome)}
            >
              {Object.entries(OUTCOME_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="howItWent">
              How did the interview go? *
            </label>
            <textarea
              id="howItWent"
              className="input-field min-h-[120px]"
              required
              value={howItWent}
              onChange={(e) => setHowItWent(e.target.value)}
              placeholder="Overall feel, pacing, interviewer style, surprises..."
            />
          </div>

          <div>
            <label className="label">
              How accurate were our predicted questions? ({questionAccuracyRating}/5)
            </label>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              className="w-full"
              value={questionAccuracyRating}
              onChange={(e) => setQuestionAccuracyRating(Number(e.target.value))}
            />
            <div className="mt-1 flex justify-between text-xs text-gray-400">
              <span>Way off</span>
              <span>Spot on</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="questionsAsked">
              Questions actually asked (one per line)
            </label>
            <textarea
              id="questionsAsked"
              className="input-field min-h-[100px]"
              value={questionsAsked}
              onChange={(e) => setQuestionsAsked(e.target.value)}
              placeholder="Paste or type each question on its own line"
            />
          </div>

          <div>
            <label className="label" htmlFor="questionsWeMissed">
              Questions we didn&apos;t predict (one per line)
            </label>
            <textarea
              id="questionsWeMissed"
              className="input-field min-h-[100px]"
              value={questionsWeMissed}
              onChange={(e) => setQuestionsWeMissed(e.target.value)}
              placeholder="Surprise questions MockIt should learn from"
            />
          </div>

          <div>
            <label className="label" htmlFor="unexpectedDifficulties">
              Unexpected difficulties
            </label>
            <textarea
              id="unexpectedDifficulties"
              className="input-field min-h-[80px]"
              value={unexpectedDifficulties}
              onChange={(e) => setUnexpectedDifficulties(e.target.value)}
              placeholder="Format changes, tough follow-ups, nerves, technical issues..."
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="label" htmlFor="whatWentWell">
            What went well
          </label>
          <textarea
            id="whatWentWell"
            className="input-field min-h-[80px]"
            value={whatWentWell}
            onChange={(e) => setWhatWentWell(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="whatToImprove">
            What to improve next time
          </label>
          <textarea
            id="whatToImprove"
            className="input-field min-h-[80px]"
            value={whatToImprove}
            onChange={(e) => setWhatToImprove(e.target.value)}
          />
        </div>
      </div>

      {predictedQuestions.length > 0 && (
        <section className="card">
          <h2 className="mb-3 font-semibold">Our predicted questions</h2>
          <p className="mb-4 text-sm text-gray-500">
            Click to mark as asked or as a miss — helps MockIt calibrate over time.
          </p>
          <ul className="space-y-2">
            {predictedQuestions.map((q, i) => (
              <li
                key={i}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-gray-100 p-3 text-sm"
              >
                <span className="flex-1 text-gray-700">{q}</span>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    className="rounded bg-green-50 px-2 py-1 text-xs text-green-700 hover:bg-green-100"
                    onClick={() => addPredictedToAsked(q)}
                  >
                    Asked
                  </button>
                  <button
                    type="button"
                    className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-700 hover:bg-amber-100"
                    onClick={() => addPredictedToMissed(q)}
                  >
                    Missed
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
          Debrief saved — MockIt will use this to improve your next session.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving..." : initialDebrief ? "Update debrief" : "Save debrief"}
        </button>
      </div>
    </form>
  );
}

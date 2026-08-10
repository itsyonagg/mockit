"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EvaluationPanel } from "./EvaluationPanel";
import { VoiceRecorder } from "./VoiceRecorder";

type Question = { id: string; text: string; source?: string };

type FeedbackResult = Parameters<typeof EvaluationPanel>[0]["result"];

export function MockInterview({
  sessionId,
  initialQuestion,
  defaultMode = "text",
}: {
  sessionId: string;
  initialQuestion: Question | null;
  defaultMode?: "text" | "voice";
}) {
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(initialQuestion);
  const [answer, setAnswer] = useState("");
  const [answerMode, setAnswerMode] = useState<"text" | "voice">(defaultMode);
  const [durationSeconds, setDurationSeconds] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [tone, setTone] = useState("balanced");
  const [depth, setDepth] = useState("standard");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);

  async function submit(pushHarder = false) {
    if (!question || answer.length < 10) return;
    setLoading(true);
    setResult(null);

    const res = await fetch(`/api/v1/sessions/${sessionId}/mock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "answer",
        questionId: question.id,
        answerText: answer,
        answerMode,
        durationSeconds,
        tone,
        depth,
        focusAreas,
        pushHarder,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(data.error ?? "Failed to submit answer");
      return;
    }

    setResult(data);
    setAnswer("");
    setDurationSeconds(undefined);
  }

  function goToNext() {
    if (!result) return;
    if (result.done) {
      setQuestion(null);
      setResult(null);
    } else if (result.nextQuestion) {
      setQuestion(result.nextQuestion);
      setResult(null);
    }
  }

  function handleVoiceTranscript(text: string, duration: number) {
    setAnswer(text);
    setAnswerMode("voice");
    setDurationSeconds(duration);
  }

  if (!question && !result) {
    return (
      <div className="card text-center">
        <h2 className="text-xl font-semibold">Mock interview complete</h2>
        <p className="mt-2 text-gray-600">You&apos;ve answered all questions.</p>
        <div className="mt-4 flex justify-center gap-3">
          <Link href={`/sessions/${sessionId}/dashboard`} className="btn-primary">
            View coaching dashboard
          </Link>
          <Link href={`/sessions/${sessionId}/summary`} className="btn-secondary">
            Export transcript
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          Mock interview {answerMode === "voice" ? "(voice)" : ""}
        </h1>
        <div className="flex gap-2 text-sm">
          <Link
            href={`/sessions/${sessionId}/dashboard`}
            className="text-brand-600 hover:underline"
          >
            Dashboard
          </Link>
          <Link
            href={`/sessions/${sessionId}/questions`}
            className="text-gray-500 hover:text-brand-600"
          >
            ← Questions
          </Link>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAnswerMode("text")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            answerMode === "text" ? "bg-brand-600 text-white" : "bg-gray-100"
          }`}
        >
          Text
        </button>
        <button
          type="button"
          onClick={() => setAnswerMode("voice")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            answerMode === "voice" ? "bg-brand-600 text-white" : "bg-gray-100"
          }`}
        >
          Voice
        </button>
      </div>

      {question && (
        <div className="card">
          <p className="text-xs uppercase text-gray-400">Interviewer</p>
          <p className="mt-2 text-lg font-medium text-gray-900">{question.text}</p>
        </div>
      )}

      {question && !result && (
        <div className="card space-y-4">
          {answerMode === "voice" && (
            <VoiceRecorder onTranscript={handleVoiceTranscript} disabled={loading} />
          )}

          <label className="label" htmlFor="answer">
            {answerMode === "voice" ? "Transcript (edit if needed)" : "Your answer"}
          </label>
          <textarea
            id="answer"
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              if (answerMode === "voice" && e.target.value) setAnswerMode("voice");
            }}
            rows={8}
            className="input-field"
            placeholder={
              answerMode === "voice"
                ? "Your spoken answer will appear here…"
                : "Type your answer here..."
            }
            disabled={loading}
          />

          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <label className="label">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="input-field w-auto"
              >
                <option value="direct">Direct</option>
                <option value="balanced">Balanced</option>
                <option value="supportive">Supportive</option>
              </select>
            </div>
            <div>
              <label className="label">Depth</label>
              <select
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                className="input-field w-auto"
              >
                <option value="quick">Quick tips</option>
                <option value="standard">Standard</option>
                <option value="deep">Deep rewrite</option>
              </select>
            </div>
          </div>

          <div>
            <p className="label">Focus areas</p>
            <div className="flex flex-wrap gap-2">
              {["structure", "storytelling", "technical_depth", "culture_fit"].map(
                (area) => (
                  <label
                    key={area}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={focusAreas.includes(area)}
                      onChange={(e) =>
                        setFocusAreas((prev) =>
                          e.target.checked
                            ? [...prev, area]
                            : prev.filter((a) => a !== area),
                        )
                      }
                    />
                    {area.replace("_", " ")}
                  </label>
                ),
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={loading || answer.length < 10}
              className="btn-primary"
            >
              {loading ? "Evaluating..." : "Submit answer"}
            </button>
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={loading || answer.length < 10}
              className="btn-secondary"
            >
              Push harder
            </button>
          </div>
        </div>
      )}

      {result && (
        <>
          <EvaluationPanel result={result} />
          {result.done ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push(`/sessions/${sessionId}/dashboard`)}
                className="btn-primary"
              >
                View coaching dashboard
              </button>
              <button
                type="button"
                onClick={() => router.push(`/sessions/${sessionId}/summary`)}
                className="btn-secondary"
              >
                Full transcript
              </button>
            </div>
          ) : (
            <button type="button" onClick={goToNext} className="btn-primary">
              Next question →
            </button>
          )}
        </>
      )}
    </div>
  );
}

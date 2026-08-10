import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionDetail } from "@/lib/services/session-service";

type Props = { params: Promise<{ id: string }> };

export default async function SummaryPage({ params }: Props) {
  const { id } = await params;
  const session = await getSessionDetail(id);
  if (!session) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{session.name}</h1>
          <p className="mt-1 text-gray-600">
            {session.targetCompanyOrSchool} · {session.targetRoleOrProgram} ·{" "}
            {session.interviewType}
          </p>
        </div>
        <a
          href={`/api/v1/sessions/${id}?format=md`}
          className="btn-secondary"
          download
        >
          Export markdown
        </a>
      </div>

      {session.answers.length === 0 ? (
        <div className="card text-center text-gray-600">
          <p>No answers yet.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href={`/sessions/${id}/mock`} className="btn-primary">
              Start mock interview
            </Link>
            <Link href={`/sessions/${id}/mock?mode=voice`} className="btn-secondary">
              Voice practice
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {session.answers.map((answer) => {
            const evaluation = answer.evaluations[0];
            const fb = evaluation?.feedbackItems[0];
            return (
              <article key={answer.id} className="card space-y-3">
                <p className="text-xs uppercase text-gray-400">Question</p>
                <p className="font-medium">{answer.question.text}</p>
                <p className="text-xs uppercase text-gray-400">Your answer</p>
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {answer.contentText}
                </p>
                {evaluation && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {Object.entries(evaluation.scores).map(([k, v]) => (
                      <div key={k} className="rounded bg-gray-50 px-2 py-1 text-center text-xs">
                        <p className="capitalize text-gray-500">{k}</p>
                        <p className="font-semibold">{v}</p>
                      </div>
                    ))}
                  </div>
                )}
                {fb && (
                  <div className="rounded-lg bg-brand-50/50 p-3 text-sm text-gray-700">
                    {fb.coachingNotes}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className="flex gap-3">
        <Link href={`/sessions/${id}/dashboard`} className="btn-primary">
          Coaching dashboard
        </Link>
        <Link href={`/sessions/${id}/mock`} className="btn-secondary">
          Continue practicing
        </Link>
        <Link href={`/sessions/${id}/mock?mode=voice`} className="btn-secondary">
          Voice mode
        </Link>
        <Link href="/" className="btn-secondary">
          Home
        </Link>
      </div>
    </div>
  );
}

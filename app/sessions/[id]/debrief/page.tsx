import Link from "next/link";
import { notFound } from "next/navigation";
import { InterviewDebriefForm } from "@/components/InterviewDebriefForm";
import { getDebrief } from "@/lib/services/learning-service";
import { getSessionDetail } from "@/lib/services/session-service";

type Props = { params: Promise<{ id: string }> };

export default async function DebriefPage({ params }: Props) {
  const { id } = await params;
  const session = await getSessionDetail(id);
  if (!session) notFound();

  const debrief = await getDebrief(id);
  const predictedQuestions = session.questions
    .filter((q) => q.selected)
    .map((q) => q.text);

  return (
    <div className="space-y-6">
      <InterviewDebriefForm
        sessionId={id}
        sessionName={session.name ?? "Session"}
        predictedQuestions={predictedQuestions}
        initialDebrief={debrief ?? undefined}
      />
      <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-6">
        <Link href={`/sessions/${id}/dashboard`} className="btn-secondary">
          Back to dashboard
        </Link>
        <Link href={`/sessions/${id}/action-plans`} className="btn-secondary">
          Action plans
        </Link>
        <Link href="/progress" className="btn-secondary">
          View all progress
        </Link>
      </div>
    </div>
  );
}

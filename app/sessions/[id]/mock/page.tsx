import { notFound, redirect } from "next/navigation";
import { MockInterview } from "@/components/MockInterview";
import { getSessionDetail, startMock } from "@/lib/services/session-service";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
};

export default async function MockPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { mode } = await searchParams;
  const session = await getSessionDetail(id);
  if (!session) notFound();

  if (session.questions.length === 0) {
    redirect(`/sessions/${id}/questions`);
  }

  const firstQuestion =
    session.status === "interviewing"
      ? session.questions.find(
          (q) =>
            q.selected &&
            !session.answers.some((a) => a.questionId === q.id),
        ) ?? null
      : await startMock(id);

  return (
    <MockInterview
      sessionId={id}
      initialQuestion={firstQuestion}
      defaultMode={mode === "voice" ? "voice" : "text"}
    />
  );
}

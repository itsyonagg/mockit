import { notFound } from "next/navigation";
import { QuestionList } from "@/components/QuestionList";
import { getSessionDetail } from "@/lib/services/session-service";

type Props = { params: Promise<{ id: string }> };

export default async function QuestionsPage({ params }: Props) {
  const { id } = await params;
  const session = await getSessionDetail(id);
  if (!session) notFound();

  return (
    <QuestionList sessionId={id} questions={session.questions} />
  );
}

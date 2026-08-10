import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionPlanTracker } from "@/components/ActionPlanTracker";
import { listActionPlans } from "@/lib/services/action-plan-service";
import { getSessionDetail } from "@/lib/services/session-service";

type Props = { params: Promise<{ id: string }> };

export default async function ActionPlansPage({ params }: Props) {
  const { id } = await params;
  const session = await getSessionDetail(id);
  if (!session) notFound();

  const plans = await listActionPlans(id);

  return (
    <div className="space-y-6">
      <ActionPlanTracker sessionId={id} initialPlans={plans} />
      <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-6">
        <Link href={`/sessions/${id}/dashboard`} className="btn-secondary">
          Back to dashboard
        </Link>
        <Link href={`/sessions/${id}/debrief`} className="btn-secondary">
          Log interview debrief
        </Link>
        <Link href="/progress" className="btn-secondary">
          View all progress
        </Link>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { CoachingDashboard } from "@/components/CoachingDashboard";
import { getSessionDashboard } from "@/lib/services/session-service";

type Props = { params: Promise<{ id: string }> };

export default async function DashboardPage({ params }: Props) {
  const { id } = await params;
  try {
    const dashboard = await getSessionDashboard(id);
    return <CoachingDashboard data={dashboard} sessionId={id} />;
  } catch {
    notFound();
  }
}

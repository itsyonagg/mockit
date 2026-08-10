import { NextResponse } from "next/server";
import { getSessionDashboard } from "@/lib/services/session-service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const dashboard = await getSessionDashboard(id);
    return NextResponse.json({ dashboard });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Dashboard error" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import {
  createActionPlan,
  listActionPlans,
  syncActionPlansFromDashboard,
} from "@/lib/services/action-plan-service";
import { createActionPlanSchema } from "@/lib/validations/learning";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const plans = await listActionPlans(id);
    return NextResponse.json({ actionPlans: plans });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load plans" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.syncFromDashboard) {
      const plans = await syncActionPlansFromDashboard(id);
      return NextResponse.json({ actionPlans: plans });
    }

    const parsed = createActionPlanSchema.parse(body);
    const plan = await createActionPlan(id, parsed);
    return NextResponse.json({ actionPlan: plan });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create plan" },
      { status: 400 },
    );
  }
}

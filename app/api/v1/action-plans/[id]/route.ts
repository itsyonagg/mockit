import { NextResponse } from "next/server";
import { updateActionPlan } from "@/lib/services/action-plan-service";
import { updateActionPlanSchema } from "@/lib/validations/learning";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateActionPlanSchema.parse(body);
    const plan = await updateActionPlan(id, parsed);
    return NextResponse.json({ actionPlan: plan });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update plan" },
      { status: 400 },
    );
  }
}

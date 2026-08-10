import { NextResponse } from "next/server";
import { getDebrief, saveDebrief } from "@/lib/services/learning-service";
import { saveDebriefSchema } from "@/lib/validations/learning";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const debrief = await getDebrief(id);
    return NextResponse.json({ debrief });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load debrief" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = saveDebriefSchema.parse(body);
    const debrief = await saveDebrief(id, parsed);
    return NextResponse.json({ debrief });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save debrief" },
      { status: 400 },
    );
  }
}

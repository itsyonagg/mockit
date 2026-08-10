import { NextResponse } from "next/server";
import {
  generateAndSaveInsights,
  getLatestInsights,
  getProgressOverview,
} from "@/lib/services/learning-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const regenerate = searchParams.get("regenerate") === "true";
    const overview = await getProgressOverview();

    const result = regenerate
      ? await generateAndSaveInsights(true)
      : await generateAndSaveInsights(false);

    const latest = await getLatestInsights();

    return NextResponse.json({
      insights: result.insights,
      cached: result.cached,
      generatedAt: result.generatedAt,
      overview,
      snapshotId: latest?.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load insights" },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const result = await generateAndSaveInsights(true);
    const overview = await getProgressOverview();
    return NextResponse.json({ ...result, overview });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate insights" },
      { status: 500 },
    );
  }
}

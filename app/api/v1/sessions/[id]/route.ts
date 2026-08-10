import { NextResponse } from "next/server";
import {
  analyzeSession,
  exportSessionMarkdown,
  getSessionDetail,
} from "@/lib/services/session-service";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");

    const session = await getSessionDetail(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (format === "md") {
      const markdown = exportSessionMarkdown(session);
      return new NextResponse(markdown, {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": `attachment; filename="mockit-${id}.md"`,
        },
      });
    }

    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get session" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === "analyze") {
      const result = await analyzeSession(id);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process session" },
      { status: 500 },
    );
  }
}

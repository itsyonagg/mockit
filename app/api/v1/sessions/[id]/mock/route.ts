import { NextResponse } from "next/server";
import { startMock, submitAnswer } from "@/lib/services/session-service";
import {
  feedbackParamsSchema,
  submitAnswerSchema,
} from "@/lib/validations/session";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === "start") {
      const question = await startMock(id);
      return NextResponse.json({ question });
    }

    if (body.action === "answer") {
      const { questionId, answerText, answerMode, durationSeconds } =
        submitAnswerSchema.parse(body);
      const feedbackParams = feedbackParamsSchema.parse(body);
      const result = await submitAnswer(id, questionId, answerText, feedbackParams, {
        pushHarder: body.pushHarder === true,
        answerMode,
        durationSeconds,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Mock interview error" },
      { status: 400 },
    );
  }
}

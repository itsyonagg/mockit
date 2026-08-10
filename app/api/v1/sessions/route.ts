import { NextResponse } from "next/server";
import { listSessions } from "@/lib/services/session-service";
import {
  createSessionFromFormData,
  DocumentParseError,
} from "@/lib/services/intake-service";
import { createSessionSchema } from "@/lib/validations/session";
import { createSession } from "@/lib/services/session-service";

export async function GET() {
  try {
    const sessions = await listSessions();
    return NextResponse.json({ sessions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list sessions" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const sessionId = await createSessionFromFormData(formData);
      return NextResponse.json({ sessionId }, { status: 201 });
    }

    const body = await request.json();
    const input = createSessionSchema.parse(body);
    const sessionId = await createSession(input);
    return NextResponse.json({ sessionId }, { status: 201 });
  } catch (error) {
    if (error instanceof DocumentParseError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

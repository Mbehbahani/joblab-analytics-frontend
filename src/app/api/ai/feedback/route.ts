import { NextResponse } from "next/server";

const LLM_BACKEND_URL = process.env.LLM_BACKEND_URL?.replace(/\/+$/, "");

type FeedbackPayload = {
  trace_id?: unknown;
  conversation_id?: unknown;
  turn_id?: unknown;
  thumbs_up?: unknown;
  comment?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FeedbackPayload;

    const traceId = typeof body?.trace_id === "string" ? body.trace_id.trim() : "";
    const conversationId =
      typeof body?.conversation_id === "string" ? body.conversation_id.trim() : "";
    const turnId = typeof body?.turn_id === "string" ? body.turn_id.trim() : "";
    const thumbsUp = body?.thumbs_up;
    const comment = body?.comment;

    if (!traceId && !(conversationId && turnId)) {
      return NextResponse.json(
        { error: "Either trace_id, or both conversation_id and turn_id, is required." },
        { status: 400 }
      );
    }

    if (typeof thumbsUp !== "boolean") {
      return NextResponse.json(
        { error: "thumbs_up must be a boolean." },
        { status: 400 }
      );
    }

    if (comment !== undefined && comment !== null && typeof comment !== "string") {
      return NextResponse.json(
        { error: "comment must be a string when provided." },
        { status: 400 }
      );
    }

    const backendRes = await fetch(`${LLM_BACKEND_URL}/ai/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(traceId ? { trace_id: traceId } : {}),
        ...(conversationId ? { conversation_id: conversationId } : {}),
        ...(turnId ? { turn_id: turnId } : {}),
        thumbs_up: thumbsUp,
        ...(typeof comment === "string" && comment.trim()
          ? { comment: comment.trim() }
          : {}),
      }),
    });

    if (!backendRes.ok) {
      const errText = await backendRes.text();
      console.error("[ai/feedback] Backend error:", backendRes.status, errText);

      const status =
        backendRes.status >= 400 && backendRes.status < 500 ? backendRes.status : 502;

      return NextResponse.json(
        { error: "Feedback service is temporarily unavailable." },
        { status }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[ai/feedback] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

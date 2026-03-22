import { NextResponse } from "next/server";

/**
 * POST /api/ai/search
 * Proxies AI queries to the LLMBackend, keeping Bedrock details hidden.
 *  * const LLM_BACKEND_URL =
 * (process.env.LLM_BACKEND_URL || "https://1b0gjjoleg.execute-api.us-east-1.amazonaws.com/").replace(/\/+$/, "");
 * const LLM_BACKEND_URL = "http://localhost:8000";
 */

const LLM_BACKEND_URL = process.env.LLM_BACKEND_URL?.replace(/\/+$/, "");

// const LLM_BACKEND_URL = "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question: string | undefined = body?.question;
    const conversationId: string | undefined = body?.conversation_id;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json(
        { error: "A non-empty question is required." },
        { status: 400 }
      );
    } 

    const backendRes = await fetch(`${LLM_BACKEND_URL}/ai/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: question.trim(),
        ...(conversationId ? { conversation_id: conversationId } : {}),
      }),
    });

    if (!backendRes.ok) {
      const errText = await backendRes.text();
      console.error("[ai/search] Backend error:", backendRes.status, errText);
      return NextResponse.json(
        { error: "AI service is temporarily unavailable." },
        { status: 502 }
      );
    }

    const data = await backendRes.json();

    // Forward answer + tool_calls (for chart recommendations)
    // Never expose model ID, usage, etc.
    return NextResponse.json({
      answer: data.answer ?? "",
      tool_calls: data.tool_calls ?? null,
      job_results: data.job_results ?? null,
      gate_outcome: data.gate_outcome ?? null,
      result_type: data.result_type ?? null,
      conversation_id: data.conversation_id ?? null,
      turn_id: data.turn_id ?? null,
      trace_id: data.trace_id ?? null,
    });
  } catch (err) {
    console.error("[ai/search] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

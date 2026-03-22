import { NextResponse } from "next/server";

/**
 * POST /api/ai/match-cv
 * Proxies CV matching requests to the Lambda backend.
 * Accepts either:
 *   - JSON body: { cv_text: string }
 *   - FormData:  file (PDF) + optional cv_text
 *
 * PDF parsing is handled by the backend to avoid Next.js native module issues.
 */

const LLM_BACKEND_URL = process.env.LLM_BACKEND_URL?.replace(/\/+$/, "");

// const LLM_BACKEND_URL = "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      // ── PDF upload path: forward FormData directly to backend ──
      const formData = await request.formData();
      const backendRes = await fetch(`${LLM_BACKEND_URL}/ai/match-cv`, {
        method: "POST",
        body: formData,
      });

      if (!backendRes.ok) {
        const errText = await backendRes.text();
        console.error("[ai/match-cv] Backend error:", backendRes.status, errText);
        return NextResponse.json(
          { error: "CV matching service is temporarily unavailable." },
          { status: 502 }
        );
      }

      const data = await backendRes.json();
      return NextResponse.json(data);
    } else {
      // ── JSON path: text-only submission ──
      const body = await request.json();
      const cvText = body?.cv_text;

      if (!cvText || typeof cvText !== "string" || cvText.trim().length < 10) {
        return NextResponse.json(
          { error: "CV text must be at least 10 characters." },
          { status: 400 }
        );
      }

      const backendRes = await fetch(`${LLM_BACKEND_URL}/ai/match-cv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv_text: cvText.trim() }),
      });

      if (!backendRes.ok) {
        const errText = await backendRes.text();
        console.error("[ai/match-cv] Backend error:", backendRes.status, errText);
        return NextResponse.json(
          { error: "CV matching service is temporarily unavailable." },
          { status: 502 }
        );
      }

      const data = await backendRes.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    console.error("[ai/match-cv] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

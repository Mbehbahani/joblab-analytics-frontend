import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/check-duplicate — Check if a job URL already exists on the Kanban board.
 */
export async function POST(req: NextRequest) {
  const convexSiteUrl = process.env.PROMUS_CONVEX_SITE_URL;
  const apiKey = process.env.PROMUS_API_KEY;

  if (!convexSiteUrl) {
    return NextResponse.json(
      { error: "Integration not configured" },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  try {
    const res = await fetch(
      `${convexSiteUrl}/api/integration/check-duplicate`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to Kanban service" },
      { status: 502 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/apply — Proxy request to JobPilot Convex HTTP endpoint
 * to add a job to the Kanban board's "Targeted" column.
 */
export async function POST(req: NextRequest) {
  const convexSiteUrl = process.env.PROMUS_CONVEX_SITE_URL;
  const apiKey = process.env.PROMUS_API_KEY;

  if (!convexSiteUrl) {
    return NextResponse.json(
      {
        error: "Integration not configured",
        message:
          "Set PROMUS_CONVEX_SITE_URL and PROMUS_API_KEY environment variables.",
      },
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
      `${convexSiteUrl}/api/integration/add-job`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to connect to JobPilot",
        message:
          err instanceof Error ? err.message : "Network error",
      },
      { status: 502 }
    );
  }
}

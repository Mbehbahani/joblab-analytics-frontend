import { NextRequest, NextResponse } from "next/server";

const CONVEX_SITE_URL =
  process.env.PROMUS_CONVEX_SITE_URL || "https://merry-impala-369.convex.site";
const INTEGRATION_API_KEY = process.env.PROMUS_INTEGRATION_API_KEY || "";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (INTEGRATION_API_KEY) {
    headers["Authorization"] = `Bearer ${INTEGRATION_API_KEY}`;
  }

  try {
    const res = await fetch(
      `${CONVEX_SITE_URL}/api/integration/check-duplicate`,
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

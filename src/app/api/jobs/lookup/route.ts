import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * GET /api/jobs/lookup?job_id=xxx  OR  ?q=search+term
 * Returns matching jobs from Supabase for the Job Lookup panel.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("job_id");
    const query = searchParams.get("q");
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

    const supabase = createServerClient();

    let data;
    let error;

    if (jobId) {
      // Exact job_id lookup (supports partial match)
      const result = await supabase
        .from("jobs")
        .select(
          "job_id, actual_role, company_name, country, location, url, posted_date, " +
          "job_level_std, job_function_std, company_industry_std, job_type_filled, " +
          "platform, is_remote, is_research, skills"
        )
        .ilike("job_id", `%${jobId}%`)
        .eq("has_url_duplicate", 0)
        .order("posted_date", { ascending: false })
        .limit(limit);
      data = result.data;
      error = result.error;
    } else if (query && query.trim().length >= 2) {
      // Free-text search across role, company, skills
      const q = query.trim();
      const result = await supabase
        .from("jobs")
        .select(
          "job_id, actual_role, company_name, country, location, url, posted_date, " +
          "job_level_std, job_function_std, company_industry_std, job_type_filled, " +
          "platform, is_remote, is_research, skills"
        )
        .eq("has_url_duplicate", 0)
        .or(
          `actual_role.ilike.%${q}%,company_name.ilike.%${q}%,skills.ilike.%${q}%`
        )
        .order("posted_date", { ascending: false })
        .limit(limit);
      data = result.data;
      error = result.error;
    } else {
      return NextResponse.json(
        { error: "Provide ?job_id=... or ?q=... (min 2 chars)" },
        { status: 400 }
      );
    }

    if (error) {
      console.error("[jobs/lookup] Supabase error:", error);
      return NextResponse.json(
        { error: "Database query failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({ jobs: data ?? [], count: data?.length ?? 0 });
  } catch (err) {
    console.error("[jobs/lookup] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}

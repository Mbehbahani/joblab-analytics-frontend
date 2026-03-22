import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("job_id");

    if (!jobId) {
      return NextResponse.json({ error: "job_id is required" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("jobs")
      .select(
        "job_id, actual_role, company_name, country, location, url, posted_date, " +
        "job_level_std, job_function_std, company_industry_std, education_level, " +
        "job_type_filled, platform, is_remote, is_research, skills, " +
        "job_relevance_score, has_url_duplicate, search_term"
      )
      .eq("job_id", jobId)
      .single();

    if (error) {
      console.error("[jobs/details] Supabase error:", error);
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    return NextResponse.json({ job: data });
  } catch (err) {
    console.error("[jobs/details] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * GET /api/job-description?job_id=xxx
 * Lazy-loads a job description from the job_details table.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const job_id = searchParams.get("job_id");
    
    if (!job_id) {
      return NextResponse.json({ error: "job_id is required" }, { status: 400 });
    }
    
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from("job_details")
      .select("job_description")
      .eq("job_id", job_id)
      .single();
    
    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned, which is fine
      throw error;
    }
    
    return NextResponse.json({
      job_description: data?.job_description || null,
    });
  } catch (error: any) {
    console.error("Job description API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

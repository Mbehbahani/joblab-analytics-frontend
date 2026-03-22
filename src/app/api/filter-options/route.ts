import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * GET /api/filter-options
 * Returns distinct filter values from the database.
 * Cached for 60 seconds to reduce DB load.
 */
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Fetch all non-duplicate jobs for filter options
    const allJobs: any[] = [];
    let offset = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from("jobs")
        .select("country, job_type_filled, job_level_std, job_function_std, company_industry_std, education_level, skills, search_term, platform, posted_date, created_at")
        .eq("has_url_duplicate", 0)
        .range(offset, offset + pageSize - 1);
      
      if (error) throw error;
      if (!data || data.length === 0) break;
      allJobs.push(...data);
      if (data.length < pageSize) break;
      offset += pageSize;
    }

    const countries = [...new Set(allJobs.map(j => j.country))].sort();
    const jobTypes = [...new Set(allJobs.map(j => j.job_type_filled))].sort();
    
    const jobLevelOrder = ["Entry Level", "Mid-Level", "Senior", "Executive", "Not Specified"];
    const jobLevels = [...new Set(allJobs.map(j => j.job_level_std))].sort((a, b) => {
      const indexA = jobLevelOrder.indexOf(a);
      const indexB = jobLevelOrder.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });
    
    const jobFunctions = [...new Set(allJobs.map(j => j.job_function_std))].sort();
    const industries = [...new Set(allJobs.map(j => j.company_industry_std))].sort();
    const platforms = [...new Set(allJobs.map(j => j.platform))].sort();

    const eduSet = new Set<string>();
    allJobs.forEach(j => {
      j.education_level?.split(",").forEach((e: string) => {
        const trimmed = e.trim();
        if (trimmed) eduSet.add(trimmed);
      });
    });
    const educationLevels = [...eduSet].sort();

    const skillsSet = new Set<string>();
    allJobs.forEach(j => {
      j.skills?.split(",").forEach((s: string) => {
        const trimmed = s.trim();
        if (trimmed) skillsSet.add(trimmed);
      });
    });
    const skills = [...skillsSet].sort();

    const searchTerms = [...new Set(
      allJobs.map(j => j.search_term).filter(Boolean) as string[]
    )].sort();

    const getDateOnly = (v?: string | null) => v ? v.split("T")[0] : null;
    const dates = allJobs.map(j => getDateOnly(j.posted_date)).filter(Boolean) as string[];
    const minDate = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : null;
    const maxDate = dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null;
    
    // Use the latest created_at as lastScrapeAt
    const createdTimes = allJobs.map(j => j.created_at).filter(Boolean);
    const lastScrapeAt = createdTimes.length 
      ? new Date(createdTimes.reduce((a: string, b: string) => a > b ? a : b)).getTime()
      : null;

    return NextResponse.json({
      countries,
      jobTypes,
      jobLevels,
      jobFunctions,
      industries,
      educationLevels,
      skills,
      searchTerms,
      platforms,
      dateRange: { min: minDate, max: maxDate },
      lastScrapeAt,
    });
  } catch (error: any) {
    console.error("Filter options API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

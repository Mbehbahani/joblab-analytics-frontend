import { NextRequest, NextResponse } from "next/server";
import { getAllJobs } from "@/lib/jobsCache";

/**
 * GET /api/filter-options
 * Returns distinct filter values from the database.
 * Must stay dynamic so header/filter dates always follow the latest data.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_request: NextRequest) {
  try {
    // Non-duplicate jobs, shared with the dashboard route's in-memory cache
    const allJobs = await getAllJobs(true);

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
    
    // Drive the header date from the latest posted job date so it matches the table/filter window.
    // We store it as a timestamp only because the UI already expects `lastScrapeAt`.
    const lastScrapeAt = maxDate ? new Date(`${maxDate}T00:00:00`).getTime() : null;

    return NextResponse.json(
      {
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
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: any) {
    console.error("Filter options API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

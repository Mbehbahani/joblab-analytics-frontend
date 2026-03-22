import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import type { DashboardFilters } from "@/types/dashboard";

// Cache dashboard results for 30 seconds to reduce DB load
// This helps with concurrent users on free tier
export const revalidate = 30;

/**
 * Single API endpoint that returns ALL dashboard data in one request.
 * This minimizes connection count for Supabase free tier.
 * 
 * POST /api/dashboard
 * Body: { filters: DashboardFilters }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filters: DashboardFilters = body.filters || {};
    
    const supabase = createServerClient();
    
    // Fetch all jobs — only exclude exact URL duplicates at DB level.
    // All other filtering is done in-memory to enable cross-filtering
    // (each chart sees data filtered by everything EXCEPT its own dimension,
    //  so its own items never disappear when you select one of them).
    let query = supabase.from("jobs").select("*");
    if (filters.exclude_duplicates !== false) {
      query = query.eq("has_url_duplicate", 0);
    }

    // Fetch up to 10000 rows (Supabase default limit is 1000, we need pagination)
    const allJobs: any[] = [];
    let offset = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data, error } = await query.range(offset, offset + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allJobs.push(...data);
      if (data.length < pageSize) break;
      offset += pageSize;
    }

    // Compute all aggregations with cross-filtering support
    const result = computeAllAggregations(allJobs, filters);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

function normalizeDateInput(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const candidate = trimmed.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return candidate;

  return null;
}

function addDaysToDateString(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split("T")[0];
}

function getDateOnly(value?: string | null): string | null {
  if (!value) return null;
  return value.split("T")[0];
}

/**
 * Apply all filters to a job list, optionally skipping one dimension.
 * Skipping a dimension enables cross-filtering: each chart sees the full
 * set of its own items (only filtered by OTHER active filters), so
 * clicking one bar doesn't make all others disappear.
 */
function applyFilters(jobs: any[], filters: DashboardFilters, skip?: keyof DashboardFilters): any[] {
  return jobs.filter(job => {
    // --- scalar equality filters ---
    if (skip !== "country" && filters.country?.length) {
      if (!filters.country.includes(job.country)) return false;
    }
    if (skip !== "job_type_filled" && filters.job_type_filled?.length) {
      if (!filters.job_type_filled.includes(job.job_type_filled)) return false;
    }
    if (skip !== "job_level_std" && filters.job_level_std?.length) {
      if (!filters.job_level_std.includes(job.job_level_std)) return false;
    }
    if (skip !== "job_function_std" && filters.job_function_std?.length) {
      if (!filters.job_function_std.includes(job.job_function_std)) return false;
    }
    if (skip !== "company_industry_std" && filters.company_industry_std?.length) {
      if (!filters.company_industry_std.includes(job.company_industry_std)) return false;
    }
    if (skip !== "platform" && filters.platform?.length) {
      if (!filters.platform.includes(job.platform)) return false;
    }
    // --- boolean filters (never skipped — they have no chart of their own) ---
    if (filters.is_remote !== null && filters.is_remote !== undefined) {
      if (job.is_remote !== filters.is_remote) return false;
    }
    if (filters.is_research !== null && filters.is_research !== undefined) {
      if (job.is_research !== filters.is_research) return false;
    }
    // --- date range (never skipped) ---
    if (filters.posted_date_range?.length === 2) {
      const [start, end] = filters.posted_date_range;
      const startDate = normalizeDateInput(start);
      const endDate = normalizeDateInput(end);
      const jobDate = getDateOnly(job.posted_date);
      if (startDate && jobDate && jobDate < startDate) return false;
      if (endDate && jobDate && jobDate > addDaysToDateString(endDate, 1)) return false;
    }
    // --- comma-separated multi-value filters ---
    if (skip !== "education_level" && filters.education_level?.length) {
      const jobEdu = job.education_level?.split(",").map((e: string) => e.trim()) || [];
      if (!filters.education_level.some(edu => jobEdu.includes(edu))) return false;
    }
    if (skip !== "skills" && filters.skills?.length) {
      const jobSkills = job.skills?.split(",").map((s: string) => s.trim()) || [];
      if (!filters.skills.some(skill => jobSkills.includes(skill))) return false;
    }
    if (skip !== "tools" && filters.tools?.length) {
      const jobTools = job.tools?.split(",").map((t: string) => t.trim()) || [];
      if (!filters.tools.some(tool => jobTools.includes(tool))) return false;
    }
    if (skip !== "search_term" && filters.search_term?.length) {
      const jobTerms = job.search_term?.split(",").map((s: string) => s.trim()) || [];
      if (!filters.search_term.some(term => jobTerms.includes(term))) return false;
    }
    return true;
  });
}

function computeAllAggregations(allJobs: any[], filters: DashboardFilters) {
  // Fully filtered dataset (KPIs, table, time-series, etc.)
  const jobs = applyFilters(allJobs, filters);

  // Cross-filtered sets: each chart's dimension is excluded from its own filter
  // so all items in that dimension remain visible regardless of which one is selected.
  const jobsForCountry       = applyFilters(allJobs, filters, "country");
  const jobsForFunction      = applyFilters(allJobs, filters, "job_function_std");
  const jobsForIndustry      = applyFilters(allJobs, filters, "company_industry_std");
  const jobsForJobType       = applyFilters(allJobs, filters, "job_type_filled");
  const jobsForJobLevel      = applyFilters(allJobs, filters, "job_level_std");
  const jobsForEducation     = applyFilters(allJobs, filters, "education_level");
  const jobsForSkills        = applyFilters(allJobs, filters, "skills");
  const jobsForTools         = applyFilters(allJobs, filters, "tools");
  const jobsForSearchTerm    = applyFilters(allJobs, filters, "search_term");
  // jobsForPlatform available if a platform chart is added later

  // KPIs — from fully filtered dataset
  const uniqueCompanies = new Set(jobs.map(j => j.company_name));
  const uniqueCountries = new Set(jobs.map(j => j.country));
  const remoteJobs = jobs.filter(j => j.is_remote).length;
  const researchJobs = jobs.filter(j => j.is_research).length;
  
  const kpis = {
    totalJobs: jobs.length,
    uniqueCompanies: uniqueCompanies.size,
    countriesCount: uniqueCountries.size,
    remoteShare: jobs.length > 0 ? (remoteJobs / jobs.length) * 100 : 0,
    researchShare: jobs.length > 0 ? (researchJobs / jobs.length) * 100 : 0,
  };

  // Country aggregation — cross-filtered (skip "country" filter)
  const countryMap = new Map<string, number>();
  jobsForCountry.forEach(j => countryMap.set(j.country, (countryMap.get(j.country) || 0) + 1));
  const aggByCountry = Array.from(countryMap.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  // Job type aggregation — cross-filtered
  const jobTypeMap = new Map<string, number>();
  jobsForJobType.forEach(j => jobTypeMap.set(j.job_type_filled, (jobTypeMap.get(j.job_type_filled) || 0) + 1));
  const aggByJobType = Array.from(jobTypeMap.entries())
    .map(([job_type_filled, count]) => ({ job_type_filled, count }))
    .sort((a, b) => b.count - a.count);

  // Job level aggregation — cross-filtered
  const jobLevelMap = new Map<string, number>();
  jobsForJobLevel.forEach(j => jobLevelMap.set(j.job_level_std, (jobLevelMap.get(j.job_level_std) || 0) + 1));
  const aggByJobLevel = Array.from(jobLevelMap.entries())
    .map(([job_level_std, count]) => ({ job_level_std, count }))
    .sort((a, b) => b.count - a.count);

  // Job function aggregation — cross-filtered
  const jobFunctionMap = new Map<string, number>();
  jobsForFunction.forEach(j => jobFunctionMap.set(j.job_function_std, (jobFunctionMap.get(j.job_function_std) || 0) + 1));
  const aggByJobFunction = Array.from(jobFunctionMap.entries())
    .map(([job_function_std, count]) => ({ job_function_std, count }))
    .sort((a, b) => b.count - a.count);

  // Industry aggregation — cross-filtered
  const industryMap = new Map<string, number>();
  jobsForIndustry.forEach(j => industryMap.set(j.company_industry_std, (industryMap.get(j.company_industry_std) || 0) + 1));
  const aggByIndustry = Array.from(industryMap.entries())
    .map(([company_industry_std, count]) => ({ company_industry_std, count }))
    .sort((a, b) => b.count - a.count);

  // Education aggregation — cross-filtered
  const eduMap = new Map<string, number>();
  jobsForEducation.forEach(j => {
    const levels = j.education_level?.split(",").map((e: string) => e.trim()) || ["Not Specified"];
    levels.forEach((edu: string) => { if (edu) eduMap.set(edu, (eduMap.get(edu) || 0) + 1); });
  });
  const aggByEducation = Array.from(eduMap.entries())
    .map(([education_level, count]) => ({ education_level, count }))
    .sort((a, b) => b.count - a.count);

  // Skills aggregation — cross-filtered
  const skillMap = new Map<string, number>();
  jobsForSkills.forEach(j => {
    if (j.skills) {
      j.skills.split(",").map((s: string) => s.trim()).forEach((skill: string) => {
        if (skill) skillMap.set(skill, (skillMap.get(skill) || 0) + 1);
      });
    }
  });
  const aggBySkills = Array.from(skillMap.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count);

  // Tools aggregation — cross-filtered
  const toolMap = new Map<string, number>();
  jobsForTools.forEach(j => {
    if (j.tools) {
      j.tools.split(",").map((s: string) => s.trim()).forEach((tool: string) => {
        if (tool) toolMap.set(tool, (toolMap.get(tool) || 0) + 1);
      });
    }
  });
  const aggByTools = Array.from(toolMap.entries())
    .map(([tool, count]) => ({ tool, count }))
    .sort((a, b) => b.count - a.count);

  // Search term aggregation — cross-filtered
  const searchTermMap = new Map<string, number>();
  jobsForSearchTerm.forEach(j => {
    const term = j.search_term || "Unknown";
    searchTermMap.set(term, (searchTermMap.get(term) || 0) + 1);
  });
  const aggBySearchTerm = Array.from(searchTermMap.entries())
    .map(([search_term, count]) => ({ search_term, count }))
    .sort((a, b) => b.count - a.count);

  // Time series
  const timeMap = new Map<string, number>();
  jobs.forEach(j => {
    const date = getDateOnly(j.posted_date);
    if (date) timeMap.set(date, (timeMap.get(date) || 0) + 1);
  });
  const timeSeriesPosted = Array.from(timeMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Heatmap: country × function
  const heatmapMap = new Map<string, number>();
  jobs.forEach(j => {
    const key = `${j.country}|${j.job_function_std}`;
    heatmapMap.set(key, (heatmapMap.get(key) || 0) + 1);
  });
  const heatmapCountryByFunction = Array.from(heatmapMap.entries()).map(([key, count]) => {
    const [country, job_function_std] = key.split("|");
    return { country, job_function_std, count };
  });

  // Stacked: job type × level
  const typeLevel = new Map<string, number>();
  jobs.forEach(j => {
    const key = `${j.job_type_filled}|${j.job_level_std}`;
    typeLevel.set(key, (typeLevel.get(key) || 0) + 1);
  });
  const stackedJobTypeByLevel = Array.from(typeLevel.entries()).map(([key, count]) => {
    const [job_type_filled, job_level_std] = key.split("|");
    return { job_type_filled, job_level_std, count };
  });

  // Stacked: education × function
  const eduFunc = new Map<string, number>();
  jobs.forEach(j => {
    const levels = j.education_level?.split(",").map((e: string) => e.trim()) || ["Not Specified"];
    levels.forEach((edu: string) => {
      if (edu) {
        const key = `${edu}|${j.job_function_std}`;
        eduFunc.set(key, (eduFunc.get(key) || 0) + 1);
      }
    });
  });
  const stackedEducationByFunction = Array.from(eduFunc.entries()).map(([key, count]) => {
    const [education_level, job_function_std] = key.split("|");
    return { education_level, job_function_std, count };
  });

  // Stacked: country × remote
  const countryRemote = new Map<string, number>();
  jobs.forEach(j => {
    const remoteStatus = j.is_remote ? "Remote" : "On-site";
    const key = `${j.country}|${remoteStatus}`;
    countryRemote.set(key, (countryRemote.get(key) || 0) + 1);
  });
  const stackedCountryByRemote = Array.from(countryRemote.entries()).map(([key, count]) => {
    const [country, is_remote] = key.split("|");
    return { country, is_remote, count };
  });

  // Research distribution
  let research = 0, industry = 0;
  jobs.forEach(j => { if (j.is_research) research++; else industry++; });
  const aggByResearch = [
    { type: "Research/Academic", count: research },
    { type: "Industry/Corporate", count: industry },
  ];

  // Industry × Function stacked
  const industryCount = new Map<string, number>();
  const functionCount = new Map<string, number>();
  jobs.forEach(j => {
    industryCount.set(j.company_industry_std, (industryCount.get(j.company_industry_std) || 0) + 1);
    functionCount.set(j.job_function_std, (functionCount.get(j.job_function_std) || 0) + 1);
  });
  const topIndustries = [...industryCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name]) => name);
  const topFunctions = [...functionCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name]) => name);
  
  const indFuncMap = new Map<string, Map<string, number>>();
  jobs.forEach(j => {
    const ind = topIndustries.includes(j.company_industry_std) ? j.company_industry_std : "Other";
    const func = topFunctions.includes(j.job_function_std) ? j.job_function_std : "Other";
    if (!indFuncMap.has(ind)) indFuncMap.set(ind, new Map());
    const m = indFuncMap.get(ind)!;
    m.set(func, (m.get(func) || 0) + 1);
  });
  const allFunctions = [...new Set([...topFunctions, "Other"])];
  const stackedIndustryByFunction = {
    data: [...indFuncMap.entries()].map(([ind, funcMap]) => {
      const row: any = { industry: ind };
      let total = 0;
      allFunctions.forEach(f => { row[f] = funcMap.get(f) || 0; total += row[f]; });
      row.total = total;
      return row;
    }).sort((a, b) => b.total - a.total),
    functions: allFunctions,
  };

  // Table data (limited to 1000, sorted by posted_date desc)
  const sortedJobs = [...jobs].sort((a, b) => {
    const dateA = a.posted_date || "";
    const dateB = b.posted_date || "";
    return dateB.localeCompare(dateA);
  });
  const tableJobs = {
    jobs: sortedJobs.slice(0, 1000).map(j => ({
      _id: String(j.id),
      job_id: j.job_id,
      actual_role: j.actual_role,
      company_name: j.company_name,
      country: j.country,
      location: j.location,
      job_type_filled: j.job_type_filled,
      job_level_std: j.job_level_std,
      job_function_std: j.job_function_std,
      company_industry_std: j.company_industry_std,
      education_level: j.education_level,
      is_remote: j.is_remote,
      is_research: j.is_research,
      posted_date: j.posted_date,
      platform: j.platform,
      url: j.url,
      skills: j.skills,
      tools: j.tools,
      job_relevance_score: j.job_relevance_score,
      has_url_duplicate: j.has_url_duplicate,
      search_term: j.search_term,
    })),
    totalCount: jobs.length,
  };

  return {
    kpis,
    aggByCountry,
    aggByJobType,
    aggByJobLevel,
    aggByJobFunction,
    aggByIndustry,
    aggByEducation,
    aggBySkills,
    aggByTools,
    aggBySearchTerm,
    timeSeriesPosted,
    heatmapCountryByFunction,
    stackedJobTypeByLevel,
    stackedEducationByFunction,
    stackedCountryByRemote,
    aggByResearch,
    stackedIndustryByFunction,
    tableJobs,
  };
}

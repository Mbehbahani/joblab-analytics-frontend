"use client";

import useSWR from "swr";
import { useStableFilters } from "@/store/filterStore";
import type { DashboardFilters } from "@/types/dashboard";

// SWR fetcher for POST requests
async function postFetcher(url: string, filters: DashboardFilters) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filters }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// SWR fetcher for GET requests
async function getFetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Hook that fetches ALL dashboard data in a single API call.
 * Returns all aggregations + table data.
 * SWR caches the result and deduplicates concurrent requests.
 */
export function useDashboardData() {
  const filters = useStableFilters();
  
  // Use JSON-stringified filters as the cache key
  const filterKey = JSON.stringify(filters);
  
  const { data, error, isLoading } = useSWR(
    ["/api/dashboard", filterKey],
    ([url]) => postFetcher(url, filters),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000,    // Deduplicate requests within 5s
      keepPreviousData: true,     // Show stale data while revalidating
    }
  );
  
  return {
    data,
    error,
    isLoading,
    // Individual data accessors used by dashboard components
    kpis: data?.kpis,
    countryData: data?.aggByCountry,
    jobFunctionData: data?.aggByJobFunction,
    industryData: data?.aggByIndustry,
    skillsData: data?.aggBySkills,
    toolsData: data?.aggByTools,
    searchTermData: data?.aggBySearchTerm,
    timeSeriesData: data?.timeSeriesPosted,
    heatmapData: data?.heatmapCountryByFunction,
    stackedTypeLevel: data?.stackedJobTypeByLevel,
    stackedEduFunction: data?.stackedEducationByFunction,
    stackedCountryRemote: data?.stackedCountryByRemote,
    researchData: data?.aggByResearch,
    industryFunctionData: data?.stackedIndustryByFunction,
    tableData: data?.tableJobs,
  };
}

/**
 * Hook to fetch filter options (distinct values for dropdowns).
 * Called once on page load, cached aggressively.
 */
export function useFilterOptions() {
  const { data, error, isLoading } = useSWR(
    "/api/filter-options",
    getFetcher,
    {
      revalidateOnFocus: true,   // Re-fetch when user returns to the tab so new-day data is picked up
      revalidateOnReconnect: true,
      dedupingInterval: 60000,   // Still deduplicate within 60s to avoid hammering the DB
    }
  );
  
  return { filterOptions: data, error, isLoading };
}

/**
 * Hook to lazy-load a job description.
 */
export function useJobDescription(job_id: string | null) {
  const { data, error, isLoading } = useSWR(
    job_id ? `/api/job-description?job_id=${encodeURIComponent(job_id)}` : null,
    getFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );
  
  return {
    description: data?.job_description || null,
    error,
    isLoading,
  };
}

/**
 * Hook to lazy-load full job details by job_id.
 */
export function useJobDetails(job_id: string | null) {
  const { data, error, isLoading } = useSWR(
    job_id ? `/api/jobs/details?job_id=${encodeURIComponent(job_id)}` : null,
    getFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    job: data?.job || null,
    error,
    isLoading,
  };
}

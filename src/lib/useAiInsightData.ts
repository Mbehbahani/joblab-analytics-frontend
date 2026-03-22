/**
 * Hook to fetch dashboard data with AI-derived filters.
 * Independent from the main dashboard's filter store.
 */

"use client";

import useSWR from "swr";
import type { DashboardFilters } from "@/types/dashboard";
import { useAiInsightStore } from "@/store/aiInsightStore";

async function postFetcher(url: string, filters: DashboardFilters) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filters }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Fetches dashboard data using the filters from the AI insight recommendation.
 * Only active when there's a recommendation in the store.
 */
export function useAiInsightData() {
  const recommendation = useAiInsightStore((s) => s.recommendation);

  const filters = recommendation?.filters ?? null;
  const filterKey = filters ? JSON.stringify(filters) : null;

  const { data, error, isLoading } = useSWR(
    // Only fetch when we have a recommendation
    filterKey ? ["/api/dashboard", "ai-insight", filterKey] : null,
    ([url]) => postFetcher(url, filters!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 10000,
      keepPreviousData: true,
    }
  );

  // Extract the specific data slice the chart needs
  const dataKey = recommendation?.dataKey;
  const chartData = data && dataKey ? data[dataKey] : undefined;

  return {
    data: chartData,
    isLoading,
    error,
    recommendation,
  };
}

/**
 * chartRecommender.ts
 *
 * Maps AI tool_calls metadata → a single chart recommendation.
 * Pure function, no side effects.
 */

import type { DashboardFilters } from "@/types/dashboard";

// ── Types ──────────────────────────────────────────────────────────────────

export type ChartType =
  | "CountryRemoteChart"
  | "CountryMapChart"
  | "JobFunctionBarChart"
  | "TimeSeriesChart"
  | "StackedJobTypeChart"
  | "HeatmapChart";

export interface ChartRecommendation {
  /** Which chart component to render */
  chartType: ChartType;
  /** Human-readable title for the chart panel */
  title: string;
  /** Filters to apply when fetching dashboard data */
  filters: DashboardFilters;
  /** Which data slice from the dashboard response to pass to the chart */
  dataKey: string;
}

export interface ChartResult {
  recommendation: ChartRecommendation | null;
  /** When no chart fits, a human-readable explanation */
  noChartReason: string | null;
}

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

// ── Filter builder ─────────────────────────────────────────────────────────

function buildFilters(input: Record<string, unknown>): DashboardFilters {
  const filters: DashboardFilters = {};

  if (input.country && typeof input.country === "string") {
    filters.country = [input.country];
  }

  if (input.is_remote === true) {
    filters.is_remote = true;
  } else if (input.is_remote === false) {
    filters.is_remote = false;
  }

  if (input.is_research === true) {
    filters.is_research = true;
  } else if (input.is_research === false) {
    filters.is_research = false;
  }

  if (input.job_function_std && typeof input.job_function_std === "string") {
    filters.job_function_std = [input.job_function_std];
  }

  if (input.job_level_std && typeof input.job_level_std === "string") {
    filters.job_level_std = [input.job_level_std];
  }

  if (input.company_industry_std && typeof input.company_industry_std === "string") {
    filters.company_industry_std = [input.company_industry_std];
  }

  if (input.job_type_filled && typeof input.job_type_filled === "string") {
    filters.job_type_filled = [input.job_type_filled];
  }

  if (input.platform && typeof input.platform === "string") {
    filters.platform = [input.platform];
  }

  // Date range
  if (input.posted_start || input.posted_end) {
    const start = typeof input.posted_start === "string" ? input.posted_start : "";
    const end = typeof input.posted_end === "string" ? input.posted_end : "";
    if (start || end) {
      filters.posted_date_range = [start || "2020-01-01", end || "2030-12-31"];
    }
  }

  return filters;
}

// ── Title builder ──────────────────────────────────────────────────────────

function buildTitle(chartType: ChartType, input: Record<string, unknown>): string {
  const parts: string[] = [];

  if (input.country) parts.push(String(input.country));
  if (input.is_remote === true) parts.push("Remote");
  if (input.is_remote === false) parts.push("On-site");
  if (input.job_function_std) parts.push(String(input.job_function_std));
  if (input.job_level_std) parts.push(String(input.job_level_std));

  // Date context
  if (input.posted_start && input.posted_end) {
    const start = String(input.posted_start);
    const end = String(input.posted_end);
    // If same month, show "Jan 2026" format
    if (start.slice(0, 7) === end.slice(0, 7)) {
      const d = new Date(start + "T00:00:00");
      const monthName = d.toLocaleString("en-US", { month: "long", year: "numeric" });
      parts.push(monthName);
    } else {
      parts.push(`${start} – ${end}`);
    }
  }

  const context = parts.length > 0 ? ` — ${parts.join(", ")}` : "";

  const chartTitles: Record<ChartType, string> = {
    CountryRemoteChart: "Country × Remote Status",
    CountryMapChart: "Jobs by Country",
    JobFunctionBarChart: "Jobs by Function",
    TimeSeriesChart: "Monthly Trend",
    StackedJobTypeChart: "Job Type × Level",
    HeatmapChart: "Country × Function",
  };

  return `${chartTitles[chartType]}${context}`;
}

// ── Filter complexity helpers ──────────────────────────────────────────────

/** Keys that count as narrowing, non-date filters. */
const NARROWING_KEYS: readonly string[] = [
  "country",
  "is_remote",
  "is_research",
  "job_function_std",
  "job_level_std",
  "company_industry_std",
  "job_type_filled",
  "platform",
  "role_keyword",
] as const;

/**
 * Count how many narrowing filters the LLM applied *besides* the group_by
 * dimension (which is expected). Date filters are not counted because they
 * generally don't make a chart meaningless.
 */
function countExtraFilters(
  input: Record<string, unknown>,
  groupBy?: string,
): number {
  let n = 0;
  for (const key of NARROWING_KEYS) {
    if (key === groupBy) continue; // the grouped dimension is expected
    const v = input[key];
    if (v !== undefined && v !== null && v !== "") n++;
  }
  return n;
}

/**
 * Build a human-readable description of the filters that prevent charting.
 */
function describeFilters(input: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const key of NARROWING_KEYS) {
    const v = input[key];
    if (v !== undefined && v !== null && v !== "") {
      const label = key.replace(/_/g, " ").replace(/ std$/, "");
      parts.push(`${label}=${String(v)}`);
    }
  }
  if (input.posted_start) parts.push(`from ${String(input.posted_start)}`);
  if (input.posted_end) parts.push(`to ${String(input.posted_end)}`);
  return parts.join(", ");
}

// ── Chart type selection ───────────────────────────────────────────────────

type ChartSelection = {
  chartType: ChartType;
  dataKey: string;
} | null;

function selectChartForJobStats(input: Record<string, unknown>): ChartSelection {
  const groupBy = input.group_by as string | undefined;

  if (!groupBy) return null;

  // If grouping by country AND there's a remote filter → Country × Remote
  if (groupBy === "country" && input.is_remote !== undefined) {
    return { chartType: "CountryRemoteChart", dataKey: "stackedCountryByRemote" };
  }

  // Group by country → Map chart
  if (groupBy === "country") {
    return { chartType: "CountryMapChart", dataKey: "aggByCountry" };
  }

  // Group by posted_month → Time series
  if (groupBy === "posted_month") {
    return { chartType: "TimeSeriesChart", dataKey: "timeSeriesPosted" };
  }

  // Group by job_function → Bar chart
  if (groupBy === "job_function_std") {
    return { chartType: "JobFunctionBarChart", dataKey: "aggByJobFunction" };
  }

  // Group by job_level → Stacked type chart
  if (groupBy === "job_level_std") {
    return { chartType: "StackedJobTypeChart", dataKey: "stackedJobTypeByLevel" };
  }

  // Group by company_name or platform → no specific chart
  return null;
}

function selectChartForSearchJobs(input: Record<string, unknown>): ChartSelection {
  // If searching with country + remote → Country × Remote
  if (input.country && input.is_remote !== undefined) {
    return { chartType: "CountryRemoteChart", dataKey: "stackedCountryByRemote" };
  }

  // If searching with country → Country map
  if (input.country) {
    return { chartType: "CountryMapChart", dataKey: "aggByCountry" };
  }

  // If searching with job function → Bar chart
  if (input.job_function_std) {
    return { chartType: "JobFunctionBarChart", dataKey: "aggByJobFunction" };
  }

  // Generic search → Heatmap (country × function overview)
  return { chartType: "HeatmapChart", dataKey: "heatmapCountryByFunction" };
}

// ── Main recommender ───────────────────────────────────────────────────────

/**
 * Maximum narrowing filters for search_jobs charts.
 * search_jobs picks a chart based on which filters are present, so if
 * there are too many filters total, any chart becomes too specific.
 */
const MAX_FILTERS_FOR_SEARCH_CHART = 1;

/**
 * Maximum extra narrowing filters for job_stats charts (beyond group_by).
 * job_stats groups by a dimension, so we allow that dimension + some extras.
 */
const MAX_EXTRA_FILTERS_FOR_STATS_CHART = 1;

/**
 * Given an array of tool_calls from the AI response,
 * returns a ChartResult with either a recommendation or a reason why
 * no chart fits the query.
 */
export function recommendChart(
  toolCalls: ToolCall[] | null | undefined
): ChartResult {
  const NO_TOOL: ChartResult = { recommendation: null, noChartReason: null };
  if (!toolCalls || toolCalls.length === 0) return NO_TOOL;

  // Pick the most informative tool call (prefer job_stats over search_jobs)
  const statsTool = toolCalls.find((tc) => tc.name === "job_stats");
  const searchTool = toolCalls.find((tc) => tc.name === "search_jobs");

  const primaryTool = statsTool || searchTool;
  if (!primaryTool) return NO_TOOL;

  const input = primaryTool.input;
  const groupBy = (input.group_by as string) ?? undefined;
  const isSearchTool = primaryTool.name === "search_jobs";

  // Select chart type based on tool + parameters
  const selection = isSearchTool
    ? selectChartForSearchJobs(input)
    : selectChartForJobStats(input);

  if (!selection) {
    return {
      recommendation: null,
      noChartReason: `No predefined chart available for this combination of filters (${describeFilters(input)}).`,
    };
  }

  // ── Guard: too many narrowing filters make the chart misleading ──
  // For search_jobs, count ALL filters; for job_stats, count extras beyond group_by
  const filterCount = isSearchTool
    ? countExtraFilters(input, undefined) // count all
    : countExtraFilters(input, groupBy);  // count extras only

  const threshold = isSearchTool
    ? MAX_FILTERS_FOR_SEARCH_CHART
    : MAX_EXTRA_FILTERS_FOR_STATS_CHART;

  if (filterCount > threshold) {
    return {
      recommendation: null,
      noChartReason:
        `The query has too many specific filters (${describeFilters(input)}) ` +
        `for a meaningful "${selection.chartType.replace(/([A-Z])/g, " $1").trim()}" chart. ` +
        `The answer is shown in the chat instead.`,
    };
  }

  const filters = buildFilters(input);
  const title = buildTitle(selection.chartType, input);

  return {
    recommendation: {
      chartType: selection.chartType,
      title,
      filters,
      dataKey: selection.dataKey,
    },
    noChartReason: null,
  };
}

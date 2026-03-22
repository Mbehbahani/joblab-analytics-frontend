// Dashboard filter types
export type DashboardFilters = {
  country?: string[];
  job_type_filled?: string[];
  job_level_std?: string[];
  job_function_std?: string[];
  company_industry_std?: string[];
  education_level?: string[];
  skills?: string[];
  tools?: string[];
  search_term?: string[];
  is_research?: boolean | null;
  is_remote?: boolean | null;
  posted_date_range?: [string, string] | null;
  platform?: string[];
  exclude_duplicates?: boolean;
};

// Filter options returned from backend API
export type FilterOptions = {
  countries: string[];
  jobTypes: string[];
  jobLevels: string[];
  jobFunctions: string[];
  industries: string[];
  educationLevels: string[];
  skills: string[];
  searchTerms: string[];
  platforms: string[];
  dateRange: { min: string | null; max: string | null };
  lastScrapeAt?: number | null;
};

// KPI data type
export type KpiData = {
  totalJobs: number;
  uniqueCompanies: number;
  countriesCount: number;
  remoteShare: number;
  researchShare: number;
};

// Job row for table
export type JobRow = {
  _id: string;
  actual_role: string;
  company_name: string;
  country: string;
  job_type_filled: string;
  job_level_std: string;
  job_function_std: string;
  company_industry_std: string;
  is_remote: boolean;
  posted_date: string | null | undefined;
  platform: string;
  url: string;
  tools: string | null;
};

// Chart data types
export type CountAggregation = {
  [key: string]: string | number;
};

export type TimeSeriesData = {
  date: string;
  count: number;
};

export type HeatmapData = {
  country: string;
  job_function_std: string;
  count: number;
};

export type StackedData = {
  [key: string]: string | number;
};

export type SunburstNode = {
  name: string;
  value?: number;
  children?: SunburstNode[];
};

// Job entity from database (jobs_enriched.db schema - 32 fields)
export interface Job {
  // Original fields (21)
  job_id: string;
  platform: string;
  actual_role: string;
  url: string | null;
  job_description: string;
  skills: string | null;
  tools: string | null;
  company_name: string;
  country: string;
  location: string;
  search_term: string;
  posted_date: string | null;
  scraped_at: string;
  is_remote: number; // 0 or 1
  job_level: string | null;
  job_function: string | null;
  job_type: string | null;
  company_industry: string | null;
  company_url: string | null;
  company_num_employees: string | null;
  filter_tier1_keywords: string | null;
  filter_tier2_keywords: string | null;
  
  // Preprocessing fields (6)
  has_url_duplicate: number; // 0 or 1
  job_description_clean: string;
  detected_language: string;
  education_level: string | null; // Comma-separated, e.g., "PhD, Master"
  education_field: string | null; // Comma-separated
  is_research: number; // 0 or 1 (academic/research position)
  
  // Enrichment fields (5)
  job_relevance_score: number | null;
  job_type_filled: string | null; // Full-time, Part-time, Contract, Internship
  edu_level_filled: string | null;
  job_level_std: string | null; // Mid-Level, Entry Level, Internship, Director, Associate, Executive, Not Specified
  job_function_std: string | null; // Engineering, Data Science & Analytics, Supply Chain & Logistics, etc.
  company_industry_std: string | null; // Technology & Software, Manufacturing & Industrial, etc.
}

// Filter options type
export interface FilterOptions {
  dateRange: [Date | null, Date | null];
  jobLevels: string[]; // Uses job_level_std
  jobFunctions: string[]; // Uses job_function_std
  skills: string[]; // Uses skills field
  countries: string[];
  industries: string[]; // Uses company_industry_std
  platforms: string[];
  searchTerms: string[];
  educationLevels: string[]; // Uses education_level
  educationFields: string[]; // Uses education_field
  companySizes: string[];
  jobTypes: string[]; // Uses job_type_filled: Full-time, Part-time, Contract, Internship
  isRemote: boolean | null;
  isResearch: boolean | null; // Uses is_research field
}

// Analytics summary type
export interface AnalyticsSummary {
  totalJobs: number;
  totalCountries: number;
  totalCompanies: number;
  avgSkillsPerJob: number;
  remoteJobs: number;
  researchJobs: number; // Academic/research positions
  jobsByPlatform: Record<string, number>;
  topCountries: { country: string; count: number }[];
  topSkills: { skill: string; count: number }[];
  jobsByLevel: { level: string; count: number }[]; // Uses job_level_std
  jobsByFunction: { function: string; count: number }[]; // Uses job_function_std
  jobsByIndustry: { industry: string; count: number }[]; // Uses company_industry_std
  jobsByCompanySize: { size: string; count: number }[];
  jobsOverTime: { date: string; count: number }[];
  // Additional fields
  platformSource: { source: string; count: number; percent: number }[];
  duplicateJobs: number;
  educationLevels: { level: string; count: number }[];
  educationFields: { field: string; count: number }[];
  searchTerms: { term: string; count: number }[];
  jobsByJobType: { type: string; count: number }[]; // Uses job_type_filled
  languageDistribution: { language: string; count: number }[]; // Uses detected_language
}

// Chart data types
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  count: number;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter value options (for dropdowns)
export interface FilterValueOptions {
  jobLevels: string[];
  jobFunctions: string[];
  countries: string[];
  industries: string[];
  platforms: string[];
  skills: string[];
  searchTerms: string[];
  educationLevels: string[];
  educationFields: string[];
  companySizes: string[];
  jobTypes: string[]; // Full-time, Part-time, Contract, Internship
}

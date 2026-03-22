import { create } from "zustand";
import { DashboardFilters } from "@/types/dashboard";

// Default filter state
const defaultFilters: DashboardFilters = {
  country: [],
  job_type_filled: [],
  job_level_std: [],
  job_function_std: [],
  company_industry_std: [],
  education_level: [],
  skills: [],
  tools: [],
  search_term: [],
  is_research: null,
  is_remote: null,
  posted_date_range: null,
  platform: [],
  exclude_duplicates: true,
};

interface FilterStore {
  filters: DashboardFilters;
  
  // Toggle a single value in an array filter
  toggleFilterValue: (key: keyof DashboardFilters, value: string) => void;
  
  // Set multiple values for an array filter
  setFilterValues: (key: keyof DashboardFilters, values: string[]) => void;
  
  // Set a boolean filter
  setBooleanFilter: (key: "is_research" | "is_remote", value: boolean | null) => void;
  
  // Set date range
  setDateRange: (range: [string, string] | null) => void;
  
  // Set exclude duplicates
  setExcludeDuplicates: (exclude: boolean) => void;
  
  // Reset all filters
  resetAll: () => void;
  
  // Check if any filter is active
  hasActiveFilters: () => boolean;
  
  // Get active filter count
  getActiveFilterCount: () => number;
}

export const useFilterStore = create<FilterStore>((set, get) => ({
  filters: { ...defaultFilters },
  
  toggleFilterValue: (key, value) => {
    set((state) => {
      const currentValues = (state.filters[key] as string[]) || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      
      return {
        filters: {
          ...state.filters,
          [key]: newValues,
        },
      };
    });
  },
  
  setFilterValues: (key, values) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: values,
      },
    }));
  },
  
  setBooleanFilter: (key, value) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    }));
  },
  
  setDateRange: (range) => {
    set((state) => ({
      filters: {
        ...state.filters,
        posted_date_range: range,
      },
    }));
  },
  
  setExcludeDuplicates: (exclude) => {
    set((state) => ({
      filters: {
        ...state.filters,
        exclude_duplicates: exclude,
      },
    }));
  },
  
  resetAll: () => {
    set({ filters: { ...defaultFilters } });
  },
  
  hasActiveFilters: () => {
    const { filters } = get();
    return (
      (filters.country?.length ?? 0) > 0 ||
      (filters.job_type_filled?.length ?? 0) > 0 ||
      (filters.job_level_std?.length ?? 0) > 0 ||
      (filters.job_function_std?.length ?? 0) > 0 ||
      (filters.company_industry_std?.length ?? 0) > 0 ||
      (filters.education_level?.length ?? 0) > 0 ||
      (filters.skills?.length ?? 0) > 0 ||
      (filters.tools?.length ?? 0) > 0 ||
      (filters.search_term?.length ?? 0) > 0 ||
      (filters.platform?.length ?? 0) > 0 ||
      filters.is_research !== null ||
      filters.is_remote !== null ||
      filters.posted_date_range !== null
    );
  },
  
  getActiveFilterCount: () => {
    const { filters } = get();
    let count = 0;
    
    count += filters.country?.length ?? 0;
    count += filters.job_type_filled?.length ?? 0;
    count += filters.job_level_std?.length ?? 0;
    count += filters.job_function_std?.length ?? 0;
    count += filters.company_industry_std?.length ?? 0;
    count += filters.education_level?.length ?? 0;
    count += filters.skills?.length ?? 0;
    count += filters.tools?.length ?? 0;
    count += filters.search_term?.length ?? 0;
    count += filters.platform?.length ?? 0;
    if (filters.is_research !== null) count++;
    if (filters.is_remote !== null) count++;
    if (filters.posted_date_range !== null) count++;
    
    return count;
  },
}));

// Hook to get stable filters object for API queries
export function useStableFilters() {
  const filters = useFilterStore((state) => state.filters);
  
  // Convert to format expected by API queries
  return {
    country: filters.country?.length ? filters.country : undefined,
    job_type_filled: filters.job_type_filled?.length ? filters.job_type_filled : undefined,
    job_level_std: filters.job_level_std?.length ? filters.job_level_std : undefined,
    job_function_std: filters.job_function_std?.length ? filters.job_function_std : undefined,
    company_industry_std: filters.company_industry_std?.length ? filters.company_industry_std : undefined,
    education_level: filters.education_level?.length ? filters.education_level : undefined,
    skills: filters.skills?.length ? filters.skills : undefined,
    tools: filters.tools?.length ? filters.tools : undefined,
    search_term: filters.search_term?.length ? filters.search_term : undefined,
    is_research: filters.is_research,
    is_remote: filters.is_remote,
    posted_date_range: filters.posted_date_range ?? undefined,
    platform: filters.platform?.length ? filters.platform : undefined,
    exclude_duplicates: filters.exclude_duplicates,
  };
}

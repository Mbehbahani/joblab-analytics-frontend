"use client";

import {
  Group,
  MultiSelect,
  SegmentedControl,
  Button,
  Badge,
  Chip,
  ActionIcon,
  Stack,
  Text,
  Paper,
  Collapse,
  Switch,
  TextInput,
} from "@mantine/core";
import { IconFilter, IconChevronDown, IconChevronUp, IconInfoCircle, IconCalendar, IconRefresh } from "@tabler/icons-react";
import { useFilterStore } from "@/store/filterStore";
import { FilterOptions } from "@/types/dashboard";
import { useState, useEffect, useRef } from "react";

type Props = {
  filterOptions: FilterOptions | undefined;
  loading?: boolean;
};

export function FilterBar({ filterOptions, loading }: Props) {
  const [expanded, setExpanded] = useState(false);
  const filters = useFilterStore((s) => s.filters);
  const setFilterValues = useFilterStore((s) => s.setFilterValues);
  const setBooleanFilter = useFilterStore((s) => s.setBooleanFilter);
  const setDateRange = useFilterStore((s) => s.setDateRange);
  const setExcludeDuplicates = useFilterStore((s) => s.setExcludeDuplicates);
  const toggleFilterValue = useFilterStore((s) => s.toggleFilterValue);
  const resetAll = useFilterStore((s) => s.resetAll);
  const _hasActiveFilters = useFilterStore((s) => s.hasActiveFilters)();
  const activeFilterCount = useFilterStore((s) => s.getActiveFilterCount)();

  // Track the last max date we applied so we can detect when the DB gets new jobs
  const lastAppliedMax = useRef<string | null>(null);

  // Apply/update date range when max date changes (e.g. after scraper runs or SWR re-fetches)
  useEffect(() => {
    const max = filterOptions?.dateRange?.max;
    if (!max) return;
    // Skip if max hasn't changed since the last time we applied it
    if (max === lastAppliedMax.current) return;

    if (!filters.posted_date_range) {
      // First load: apply 30-day default
      const maxDate = new Date(max);
      const startDate = new Date(maxDate);
      startDate.setDate(maxDate.getDate() - 29);
      setDateRange([startDate.toISOString().split("T")[0], maxDate.toISOString().split("T")[0]]);
    } else {
      // Max date changed while user already has a range set.
      // Only auto-update if they are on a preset (1 / 2 / 7 / 30 days), not a custom range.
      const [rawStart, rawEnd] = filters.posted_date_range;
      const diffDays =
        Math.round(
          (new Date(rawEnd).getTime() - new Date(rawStart).getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
      if ([1, 2, 7, 30].includes(diffDays)) {
        const maxDate = new Date(max);
        const startDate = new Date(maxDate);
        startDate.setDate(maxDate.getDate() - (diffDays - 1));
        setDateRange([startDate.toISOString().split("T")[0], maxDate.toISOString().split("T")[0]]);
      }
    }

    lastAppliedMax.current = max;
  }, [filterOptions?.dateRange?.max, filters.posted_date_range, setDateRange]);

  // Format date/time for last scrape display
  const formatDateTime = (timestamp?: number | null) => {
    if (!timestamp) return "N/A";
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleString();
  };

  const _formatDate = (value?: string | null) => {
    if (!value) return "N/A";
    // If value is already YYYY-MM-DD, just show it
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    // Otherwise, try to format as date
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString();
  };

  const applyRecentRange = (days: number) => {
    // Use the max posted_date from the database as the end date, not today
    const maxPostedDate = filterOptions?.dateRange?.max;
    if (!maxPostedDate) {
      // Fallback to today if no data
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - (days - 1));
      const startStr = start.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];
      setDateRange([startStr, endStr]);
      return;
    }
    
    const end = new Date(maxPostedDate);
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];
    setDateRange([startStr, endStr]);
  };

  const applyRecentOption = (value: string) => {
    if (value === "all") {
      setDateRange(null);
    } else if (value === "custom") {
      // Open expanded panel so the user can set a custom range
      setExpanded(true);
    } else {
      const days = Number(value);
      if (!isNaN(days) && days > 0) applyRecentRange(days);
    }
  };

  const getRecentSelection = () => {
    if (!filters.posted_date_range) return "all";
    const [start, end] = filters.posted_date_range;
    if (!start || !end) return "custom";
    const s = new Date(start);
    const e = new Date(end);
    const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays === 2) return "2"; // support "Last 2 days" selection
    if (diffDays === 1) return "1";
    if (diffDays === 7) return "7";
    if (diffDays === 30) return "30";
    return "custom";
  };

  const getRecentLabel = () => {
    const sel = getRecentSelection();
    if (sel === "all") return "All dates";
    if (sel === "2") return `Today (${filters.posted_date_range?.[0] ?? "-"} — ${filters.posted_date_range?.[1] ?? "-"})`;
    if (sel === "1") return `Last day (${filters.posted_date_range?.[0] ?? "-"})`;
    if (sel === "7") return `Last week (${filters.posted_date_range?.[0] ?? "-"} — ${filters.posted_date_range?.[1] ?? "-"})`;
    if (sel === "30") return `Last month (${filters.posted_date_range?.[0] ?? "-"} — ${filters.posted_date_range?.[1] ?? "-"})`;
    const [start, end] = filters.posted_date_range ?? ["-", "-"];
    return `Custom (${start} — ${end})`;
  };

  // Collect all active filter chips
  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];

  filters.country?.forEach((c) => {
    activeChips.push({
      key: `country-${c}`,
      label: `Country: ${c}`,
      onRemove: () => toggleFilterValue("country", c),
    });
  });

  filters.job_type_filled?.forEach((t) => {
    activeChips.push({
      key: `type-${t}`,
      label: `Type: ${t}`,
      onRemove: () => toggleFilterValue("job_type_filled", t),
    });
  });

  filters.job_level_std?.forEach((l) => {
    activeChips.push({
      key: `level-${l}`,
      label: `Level: ${l}`,
      onRemove: () => toggleFilterValue("job_level_std", l),
    });
  });

  filters.job_function_std?.forEach((f) => {
    activeChips.push({
      key: `function-${f}`,
      label: `Function: ${f}`,
      onRemove: () => toggleFilterValue("job_function_std", f),
    });
  });

  filters.company_industry_std?.forEach((i) => {
    activeChips.push({
      key: `industry-${i}`,
      label: `Industry: ${i}`,
      onRemove: () => toggleFilterValue("company_industry_std", i),
    });
  });

  filters.education_level?.forEach((e) => {
    activeChips.push({
      key: `edu-${e}`,
      label: `Education: ${e}`,
      onRemove: () => toggleFilterValue("education_level", e),
    });
  });

  filters.skills?.forEach((s) => {
    activeChips.push({
      key: `skill-${s}`,
      label: `Skill: ${s}`,
      onRemove: () => toggleFilterValue("skills", s),
    });
  });

  filters.search_term?.forEach((st) => {
    activeChips.push({
      key: `search-${st}`,
      label: `Search: ${st}`,
      onRemove: () => toggleFilterValue("search_term", st),
    });
  });

  filters.platform?.forEach((p) => {
    activeChips.push({
      key: `platform-${p}`,
      label: `Platform: ${p}`,
      onRemove: () => toggleFilterValue("platform", p),
    });
  });

  if (filters.is_research !== null) {
    activeChips.push({
      key: "research",
      label: filters.is_research ? "Research/Academic" : "Industry/Corporate",
      onRemove: () => setBooleanFilter("is_research", null),
    });
  }

  if (filters.is_remote !== null) {
    activeChips.push({
      key: "remote",
      label: filters.is_remote ? "Remote" : "On-site",
      onRemove: () => setBooleanFilter("is_remote", null),
    });
  }

  if (filters.posted_date_range) {
    activeChips.push({
      key: "date",
      label: `Date: ${filters.posted_date_range[0]} to ${filters.posted_date_range[1]}`,
      onRemove: () => setDateRange(null),
    });
  }

  return (
    <Paper id="dashboard-filter-bar" p="md" withBorder>
      <Stack gap="sm">
        {/* Header Row */}
        <Group justify="space-between">
          <Group 
            gap="sm" 
            style={{ cursor: 'pointer' }} 
            onClick={() => setExpanded(!expanded)}
          >
            <IconFilter size={20} />
            <Text fw={600}>Filters</Text>
            {activeFilterCount > 0 && (
              <Badge size="sm" variant="filled" color="blue">
                {activeFilterCount} active
              </Badge>
            )}
            {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}

              <Group gap={6} align="center">
                <IconCalendar size={14} />
                <Text size="xs" c="dimmed">
                  Last scrape: <Text component="span" fw={600}>{formatDateTime(filterOptions?.lastScrapeAt)}</Text>
                </Text>
              </Group>

              <Button
                variant="light"
                color="red"
                size="xs"
                leftSection={<IconRefresh size={14} />}
                onClick={(e) => { e.stopPropagation(); resetAll(); }}
                style={{ marginLeft: 8, paddingLeft: 8, paddingRight: 8 }}
              >
                Reset Filters
              </Button>
            </Group>

          <Group gap="xs">
            <Group gap="xs" align="center" wrap="nowrap">
              <div style={{ width: 220 }}>
                <SegmentedControl
                  size="xs"
                  value={getRecentSelection()}
                  onChange={(v) => applyRecentOption(v)}
                  data={[
                    { label: "All", value: "all" },
                    { label: "Today", value: "2" },
                    { label: "Week", value: "7" },
                    { label: "Month", value: "30" },
                    { label: "Custom", value: "custom" },
                  ]}
                />
                <Text size="xs" c="dimmed" mt={4}>
                  Showing: <Text component="span" fw={600}>{getRecentLabel()}</Text>
                </Text>
              </div>
            </Group>
          </Group>
        </Group>

        {/* Active Filter Chips */}
        {activeChips.length > 0 && (
          <Group gap="xs">
            {activeChips.map((chip) => (
              <Chip
                key={chip.key}
                checked
                onChange={() => chip.onRemove()}
                size="xs"
                variant="filled"
              >
                {chip.label}
              </Chip>
            ))}
          </Group>
        )}

        {/* Expanded Filter Controls */}
        <Collapse in={expanded}>
          <Stack gap="sm" mt="sm">
            <Group grow>
              <MultiSelect
                label="Country"
                placeholder="All countries"
                data={filterOptions?.countries || []}
                value={filters.country || []}
                onChange={(v) => setFilterValues("country", v)}
                searchable
                clearable
                disabled={loading}
                size="sm"
              />
              <MultiSelect
                label="Job Type"
                placeholder="All types"
                data={filterOptions?.jobTypes || []}
                value={filters.job_type_filled || []}
                onChange={(v) => setFilterValues("job_type_filled", v)}
                clearable
                disabled={loading}
                size="sm"
              />
              <MultiSelect
                label="Job Level"
                placeholder="All levels"
                data={filterOptions?.jobLevels || []}
                value={filters.job_level_std || []}
                onChange={(v) => setFilterValues("job_level_std", v)}
                clearable
                disabled={loading}
                size="sm"
              />
            </Group>

            <Group grow>
              <MultiSelect
                label="Job Function"
                placeholder="All functions"
                data={filterOptions?.jobFunctions || []}
                value={filters.job_function_std || []}
                onChange={(v) => setFilterValues("job_function_std", v)}
                searchable
                clearable
                disabled={loading}
                size="sm"
              />
              <MultiSelect
                label="Industry"
                placeholder="All industries"
                data={filterOptions?.industries || []}
                value={filters.company_industry_std || []}
                onChange={(v) => setFilterValues("company_industry_std", v)}
                searchable
                clearable
                disabled={loading}
                size="sm"
              />
              <MultiSelect
                label="Education"
                placeholder="All education levels"
                data={filterOptions?.educationLevels || []}
                value={filters.education_level || []}
                onChange={(v) => setFilterValues("education_level", v)}
                clearable
                disabled={loading}
                size="sm"
              />
            </Group>

            <Group grow>
              <MultiSelect
                label="Skills"
                placeholder="All skills"
                data={filterOptions?.skills || []}
                value={filters.skills || []}
                onChange={(v) => setFilterValues("skills", v)}
                searchable
                clearable
                disabled={loading}
                size="sm"
                limit={30}
              />
              <MultiSelect
                label="Search Term"
                placeholder="All search terms"
                data={filterOptions?.searchTerms || []}
                value={filters.search_term || []}
                onChange={(v) => setFilterValues("search_term", v)}
                searchable
                clearable
                disabled={loading}
                size="sm"
              />
              <div>
                <Text size="sm" fw={500} mb={4}>
                  Platform
                </Text>
                <SegmentedControl
                  value={
                    !filters.platform || filters.platform.length === 0
                      ? "all"
                      : filters.platform.length === 1
                      ? filters.platform[0]
                      : "multiple"
                  }
                  onChange={(v) => {
                    if (v === "all") setFilterValues("platform", []);
                    else if (v === "multiple") return; // ignore
                    else setFilterValues("platform", [v]);
                  }}
                  data={[
                    { label: "All", value: "all" },
                    ...(filterOptions?.platforms || []).map((platform) => ({
                      label: platform,
                      value: platform,
                    })),
                  ]}
                  size="sm"
                  disabled={loading}
                />
              </div>
            </Group>

            <Group grow>
              <TextInput
                label="Start Date"
                placeholder="YYYY-MM-DD"
                value={filters.posted_date_range?.[0] || ''}
                onChange={(e) => {
                  const startDate = e.currentTarget.value;
                  if (startDate && filters.posted_date_range?.[1]) {
                    setDateRange([startDate, filters.posted_date_range[1]]);
                  } else if (startDate && filterOptions?.dateRange?.max) {
                    setDateRange([startDate, filterOptions.dateRange.max]);
                  } else if (!startDate) {
                    setDateRange(null);
                  }
                }}
                leftSection={<IconCalendar size={16} />}
                disabled={loading}
                size="sm"
                type="date"
                min={filterOptions?.dateRange?.min || undefined}
                max={filterOptions?.dateRange?.max || undefined}
              />
              <TextInput
                label="End Date"
                placeholder="YYYY-MM-DD"
                value={filters.posted_date_range?.[1] || ''}
                onChange={(e) => {
                  const endDate = e.currentTarget.value;
                  if (endDate && filters.posted_date_range?.[0]) {
                    setDateRange([filters.posted_date_range[0], endDate]);
                  } else if (endDate && filterOptions?.dateRange?.min) {
                    setDateRange([filterOptions.dateRange.min, endDate]);
                  } else if (!endDate) {
                    setDateRange(null);
                  }
                }}
                leftSection={<IconCalendar size={16} />}
                disabled={loading}
                size="sm"
                type="date"
                min={filterOptions?.dateRange?.min || undefined}
                max={filterOptions?.dateRange?.max || undefined}
              />
              <div>
                <Text size="sm" fw={500} mb={4}>
                  Work Type
                </Text>
                <SegmentedControl
                  value={filters.is_remote === null ? "all" : filters.is_remote ? "remote" : "onsite"}
                  onChange={(v) => {
                    if (v === "all") setBooleanFilter("is_remote", null);
                    else if (v === "remote") setBooleanFilter("is_remote", true);
                    else setBooleanFilter("is_remote", false);
                  }}
                  data={[
                    { label: "All", value: "all" },
                    { label: "Remote", value: "remote" },
                    { label: "On-site", value: "onsite" },
                  ]}
                  size="sm"
                  disabled={loading}
                />
              </div>
              <div>
                <Text size="sm" fw={500} mb={4}>
                  Sector
                </Text>
                <SegmentedControl
                  value={filters.is_research === null ? "all" : filters.is_research ? "research" : "industry"}
                  onChange={(v) => {
                    if (v === "all") setBooleanFilter("is_research", null);
                    else if (v === "research") setBooleanFilter("is_research", true);
                    else setBooleanFilter("is_research", false);
                  }}
                  data={[
                    { label: "All", value: "all" },
                    { label: "Research", value: "research" },
                    { label: "Industry", value: "industry" },
                  ]}
                  size="sm"
                  disabled={loading}
                />
              </div>
            </Group>

            <Group justify="flex-start">
              <Switch
                label="Exclude duplicates"
                checked={filters.exclude_duplicates !== false}
                onChange={(e) => setExcludeDuplicates(e.currentTarget.checked)}
                size="sm"
              />
            </Group>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}

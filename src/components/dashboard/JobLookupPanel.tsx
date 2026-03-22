"use client";

import { useState, useCallback } from "react";
import {
  Drawer,
  Stack,
  Text,
  TextInput,
  Group,
  Paper,
  Badge,
  ScrollArea,
  ActionIcon,
  Tooltip,
  Loader,
  Alert,
  Divider,
  Box,
  useMantineColorScheme,
  SegmentedControl,
  Center,
} from "@mantine/core";
import {
  IconSearch,
  IconExternalLink,
  IconEye,
  IconAlertCircle,
  IconMapPin,
  IconBuilding,
  IconBriefcase,
  IconX,
  IconHash,
} from "@tabler/icons-react";
import { JobDetailsModal } from "@/components/jobs/JobDetailsModal";

// ── Types ──────────────────────────────────────────────────────────────────

interface LookupJob {
  job_id: string;
  actual_role: string;
  company_name: string;
  country: string;
  location?: string;
  url?: string;
  posted_date?: string;
  job_level_std?: string;
  job_function_std?: string;
  company_industry_std?: string;
  job_type_filled?: string;
  platform?: string;
  is_remote?: boolean | number;
  is_research?: boolean | number;
  skills?: string;
}

interface JobLookupPanelProps {
  opened: boolean;
  onClose: () => void;
}

// ── Helper ─────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const LEVEL_COLORS: Record<string, string> = {
  Junior: "green",
  "Entry Level": "green",
  "Mid-Level": "blue",
  Mid: "blue",
  Senior: "orange",
  Lead: "red",
  Manager: "pink",
  Director: "grape",
  Executive: "violet",
};

// ── Component ──────────────────────────────────────────────────────────────

export function JobLookupPanel({ opened, onClose }: JobLookupPanelProps) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"id" | "text">("text");
  const [jobs, setJobs] = useState<LookupJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const { colorScheme } = useMantineColorScheme();

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q || q.length < 2) return;
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const param = mode === "id" ? `job_id=${encodeURIComponent(q)}` : `q=${encodeURIComponent(q)}`;
      const res = await fetch(`/api/jobs/lookup?${param}&limit=25`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Search failed.");
        setJobs([]);
      } else {
        setJobs(data.jobs ?? []);
      }
    } catch {
      setError("Network error. Please try again.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [query, mode]);

  const handleClear = () => {
    setQuery("");
    setJobs([]);
    setError(null);
    setSearched(false);
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconSearch size={22} style={{ color: "var(--mantine-color-teal-5)" }} />
          <Text fw={600} size="lg">
            Job Lookup
          </Text>
          <Badge size="xs" variant="light" color="teal">
            Search
          </Badge>
        </Group>
      }
      position="right"
      size="lg"
      overlayProps={{ backgroundOpacity: 0.15, blur: 0.75 }}
      padding="lg"
    >
      <Stack gap="md" h="100%">
        <JobDetailsModal
          opened={!!selectedJobId}
          onClose={() => setSelectedJobId(null)}
          jobId={selectedJobId}
        />

        {/* Search mode selection */}
        <Box>
          <Text size="xs" fw={500} c="dimmed" mb={6}>
            Search Mode
          </Text>
          <SegmentedControl
            fullWidth
            value={mode}
            onChange={(val) => setMode(val as "id" | "text")}
            color="teal"
            size="sm"
            data={[
              {
                value: "text",
                label: (
                  <Center style={{ gap: 6 }}>
                    <IconBriefcase size={14} />
                    <span>Title / Company / Skills</span>
                  </Center>
                ),
              },
              {
                value: "id",
                label: (
                  <Center style={{ gap: 6 }}>
                    <IconHash size={14} />
                    <span>Job ID</span>
                  </Center>
                ),
              },
            ]}
          />
        </Box>

        {/* Search input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
        >
          <TextInput
            placeholder={
              mode === "id"
                ? "Paste a job ID (or partial ID)…"
                : "Search by title, company, or skill…"
            }
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            disabled={loading}
            rightSection={
              <Group gap={2}>
                {query && (
                  <ActionIcon variant="subtle" size="xs" onClick={handleClear}>
                    <IconX size={14} />
                  </ActionIcon>
                )}
                <Tooltip label="Search">
                  <ActionIcon
                    variant="filled"
                    color="teal"
                    onClick={handleSearch}
                    disabled={!query.trim() || query.trim().length < 2 || loading}
                    size="sm"
                  >
                    <IconSearch size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            }
            rightSectionWidth={60}
          />
        </form>

        {/* Loading */}
        {loading && (
          <Group justify="center" py="xl">
            <Loader size="sm" type="dots" />
            <Text size="sm" c="dimmed">
              Searching…
            </Text>
          </Group>
        )}

        {/* Error */}
        {error && (
          <Alert icon={<IconAlertCircle size={18} />} color="red" variant="light">
            {error}
          </Alert>
        )}

        {/* No results */}
        {searched && !loading && !error && jobs.length === 0 && (
          <Paper p="md" withBorder>
            <Text size="sm" c="dimmed" ta="center">
              No jobs found. Try a different search term.
            </Text>
          </Paper>
        )}

        {/* Results */}
        {jobs.length > 0 && (
          <Stack gap="xs" style={{ flex: 1, minHeight: 0 }}>
            <Text size="xs" c="dimmed">
              {jobs.length} result{jobs.length !== 1 ? "s" : ""} found
            </Text>
            <Divider />
            <ScrollArea style={{ flex: 1 }} offsetScrollbars>
              <Stack gap="sm">
                {jobs.map((job) => (
                  <Paper
                    key={job.job_id}
                    p="sm"
                    withBorder
                    onClick={() => setSelectedJobId(job.job_id)}
                    style={{
                      backgroundColor:
                        colorScheme === "dark"
                          ? "var(--mantine-color-dark-6)"
                          : "var(--mantine-color-gray-0)",
                      cursor: "pointer",
                    }}
                  >
                    <Stack gap={6}>
                      {/* Title & Link */}
                      <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Box style={{ flex: 1 }}>
                          <Text fw={600} size="sm" lineClamp={2}>
                            {job.actual_role}
                          </Text>
                          <Group gap={4} mt={2}>
                            <IconBuilding size={13} style={{ color: "var(--mantine-color-dimmed)" }} />
                            <Text size="xs" c="dimmed">
                              {job.company_name}
                            </Text>
                          </Group>
                        </Box>
                        <Group gap={4}>
                          <Tooltip label="View details">
                            <ActionIcon
                              variant="subtle"
                              color="grape"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedJobId(job.job_id);
                              }}
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                          </Tooltip>
                          {job.url && (
                            <Tooltip label="Open job listing">
                              <ActionIcon
                                variant="subtle"
                                color="blue"
                                component="a"
                                href={job.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="sm"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <IconExternalLink size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </Group>
                      </Group>

                      {/* Location & Date */}
                      <Group gap="xs">
                        <Group gap={4}>
                          <IconMapPin size={12} style={{ color: "var(--mantine-color-dimmed)" }} />
                          <Text size="xs" c="dimmed">
                            {job.location || job.country || "—"}
                          </Text>
                        </Group>
                        <Text size="xs" c="dimmed">
                          •
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatDate(job.posted_date)}
                        </Text>
                        {(job.is_remote === true || job.is_remote === 1) && (
                          <Badge size="xs" variant="light" color="cyan">
                            Remote
                          </Badge>
                        )}
                      </Group>

                      {/* Badges */}
                      <Group gap={4}>
                        {job.job_level_std && job.job_level_std !== "NA" && (
                          <Badge
                            size="xs"
                            variant="light"
                            color={LEVEL_COLORS[job.job_level_std] ?? "gray"}
                          >
                            {job.job_level_std}
                          </Badge>
                        )}
                        {job.job_function_std && job.job_function_std !== "NA" && (
                          <Badge size="xs" variant="outline" color="blue">
                            {job.job_function_std}
                          </Badge>
                        )}
                        {job.job_type_filled && (
                          <Badge size="xs" variant="dot" color="gray">
                            {job.job_type_filled}
                          </Badge>
                        )}
                        {job.platform && (
                          <Badge
                            size="xs"
                            variant="light"
                            color={job.platform === "LinkedIn" ? "blue" : "orange"}
                          >
                            {job.platform}
                          </Badge>
                        )}
                      </Group>

                      {/* Job ID (copyable) */}
                      <Group gap={4}>
                        <Text size="xs" c="dimmed" ff="monospace">
                          ID: {job.job_id}
                        </Text>
                      </Group>

                      {/* Skills preview */}
                      {job.skills && (
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          Skills: {job.skills}
                        </Text>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </ScrollArea>
          </Stack>
        )}

        {/* Intro text when nothing searched yet */}
        {!searched && !loading && (
          <Paper p="md" withBorder>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Search for jobs by title, company name, skills, or paste a job ID from the AI chat.
              </Text>
              <Divider />
              <Text size="xs" c="dimmed">
                <strong>Tip:</strong> When the AI mentions a job, it includes the Job ID.
                Copy it and paste here to see full details and the direct link.
              </Text>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Drawer>
  );
}

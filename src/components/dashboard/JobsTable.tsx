"use client";

import {
  Table,
  Paper,
  Text,
  Group,
  Badge,
  Pagination,
  Skeleton,
  Stack,
  ActionIcon,
  Tooltip,
  Modal,
  ScrollArea,
  Divider,
  Box,
  Anchor,
  Select,
  Loader,
  Center,
  Progress,
} from "@mantine/core";
import {
  IconExternalLink,
  IconEye,
  IconMapPin,
  IconBuilding,
  IconBriefcase,
  IconBrandLinkedin,
  IconSortAscending,
  IconSortDescending,
  IconArrowsSort,
  IconSend,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconUserOff,
} from "@tabler/icons-react";
import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useJobDescription } from "@/lib/hooks";

// Job type (without job_description - lazy loaded)
type Job = {
  _id: string;
  job_id?: string;
  actual_role: string;
  company_name: string;
  country: string;
  location?: string;
  job_type_filled: string;
  job_level_std: string;
  job_function_std: string;
  company_industry_std: string;
  education_level?: string;
  is_remote: boolean;
  is_research: boolean;
  posted_date: string | null | undefined;
  platform: string;
  url: string;
  skills?: string;
  job_relevance_score?: number | null;
  has_url_duplicate: number;
  search_term?: string;
};

type Props = {
  data: { jobs: Job[]; totalCount: number } | undefined;
  loading?: boolean;
  kanbanUserId?: string | null;
};

const LEVEL_COLORS: Record<string, string> = {
  "Entry Level": "green",
  "Mid-Level": "blue",
  "Associate": "cyan",
  "Director": "red",
  "Executive": "pink",
  "Internship": "grape",
  "Not Specified": "gray",
  "NA": "gray",
  "": "gray",
};

const FUNCTION_COLORS: Record<string, string> = {
  "Engineering": "blue",
  "Data Science & Analytics": "violet",
  "Supply Chain & Logistics": "green",
  "Operations Research": "indigo",
  "Information Technology": "cyan",
  "Research & Development": "teal",
  "Sales & Marketing": "orange",
  "Consulting": "grape",
  "Business & Finance": "yellow",
  "Management": "pink",
  "Education": "lime",
  "Product Management": "red",
  "Healthcare": "rose",
  "Other": "gray",
  "NA": "gray",
  "": "gray",
};

// Helper to format date (only date, no time)
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Unknown";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr.split("T")[0] || dateStr;
  }
}

// Platform badge component
function PlatformBadge({
  platform,
  hasDuplicate,
}: {
  platform: string;
  hasDuplicate: number;
}) {
  if (hasDuplicate === 1) {
    return (
      <Badge size="xs" variant="light" color="grape">
        Both
      </Badge>
    );
  }

  if (platform === "linkedin") {
    return (
      <Badge
        size="xs"
        variant="light"
        color="blue"
        leftSection={<IconBrandLinkedin size={10} />}
      >
        LinkedIn
      </Badge>
    );
  }

  return (
    <Badge size="xs" variant="light" color="orange">
      Indeed
    </Badge>
  );
}

// Relevance score component with professional gradient bar
function RelevanceScore({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) {
    return (
      <Text size="xs" c="dimmed">
        N/A
      </Text>
    );
  }

  // Score is 0-10, convert to percentage for display
  const percentage = (score / 10) * 100;

  // Determine color based on score (0-10 scale)
  const getColor = (value: number): string => {
    if (value >= 8) return "teal";
    if (value >= 6) return "green";
    if (value >= 4) return "yellow";
    if (value >= 2) return "orange";
    return "red";
  };

  const color = getColor(score);
  const roundedScore = Math.round(score);

  return (
    <Tooltip label={`Relevance: ${roundedScore} / 10`} withArrow>
      <Box w={90}>
        <Group gap={6} wrap="nowrap">
          <Progress.Root size="sm" w={50} radius="xl">
            <Progress.Section value={percentage} color={color} />
          </Progress.Root>
          <Text size="xs" fw={600} c={color} w={28} ta="right">
            {roundedScore}
          </Text>
        </Group>
      </Box>
    </Tooltip>
  );
}

interface SortableHeaderProps {
  label: string;
  field: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
}

function SortableHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
}: SortableHeaderProps) {
  const isActive = sortBy === field;

  return (
    <Table.Th style={{ cursor: "pointer" }} onClick={() => onSort(field)}>
      <Group gap={4} wrap="nowrap">
        <Text size="sm" fw={600}>
          {label}
        </Text>
        {isActive ? (
          sortOrder === "asc" ? (
            <IconSortAscending size={14} />
          ) : (
            <IconSortDescending size={14} />
          )
        ) : (
          <IconArrowsSort size={14} opacity={0.5} />
        )}
      </Group>
    </Table.Th>
  );
}


// Separate component for job description (lazy loaded)
function JobDescriptionSection({ job_id }: { job_id: string }) {
  const { description, isLoading } = useJobDescription(job_id);

  if (isLoading) {
    return (
      <Center py="md">
        <Loader size="sm" />
        <Text size="sm" c="dimmed" ml="xs">Loading description...</Text>
      </Center>
    );
  }

  if (!description) {
    return (
      <Text size="sm" c="dimmed" fs="italic">No description available</Text>
    );
  }

  return (
    <ScrollArea.Autosize mah={300}>
      <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
        {description}
      </Text>
    </ScrollArea.Autosize>
  );
}

export function JobsTable({ data, loading, kanbanUserId }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [sortBy, setSortBy] = useState("job_relevance_score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [applyStatus, setApplyStatus] = useState<Record<string, "idle" | "loading" | "success" | "error" | "duplicate" | "not-connected">>({});

  const handleApplyToKanban = async (job: Job) => {
    const jobKey = job._id;

    if (!kanbanUserId) {
      setApplyStatus((prev) => ({ ...prev, [jobKey]: "not-connected" }));
      setTimeout(() => setApplyStatus((prev) => ({ ...prev, [jobKey]: "idle" })), 5000);
      return;
    }

    setApplyStatus((prev) => ({ ...prev, [jobKey]: "loading" }));
    try {
      // 1. Duplicate check
      if (job.url) {
        const dupRes = await fetch("/api/check-duplicate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobUrl: job.url, ...(kanbanUserId ? { userId: kanbanUserId } : {}) }),
        });
        if (dupRes.ok) {
          const dupData = await dupRes.json();
          if (dupData.exists) {
            setApplyStatus((prev) => ({ ...prev, [jobKey]: "duplicate" }));
            setTimeout(() => setApplyStatus((prev) => ({ ...prev, [jobKey]: "idle" })), 4000);
            return;
          }
        }
      }

      // 2. Fetch job description
      let jobDescription: string | undefined;
      if (job.job_id) {
        try {
          const descRes = await fetch(`/api/job-description?job_id=${encodeURIComponent(job.job_id)}`);
          if (descRes.ok) {
            const descData = await descRes.json();
            if (descData.job_description) jobDescription = descData.job_description;
          }
        } catch {
          // Non-critical: proceed without description
        }
      }

      // 3. Send to Kanban
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(kanbanUserId ? { userId: kanbanUserId } : {}),
          title: job.actual_role,
          companyName: job.company_name,
          position: job.actual_role,
          jobUrl: job.url,
          jobDescription,
          skills: job.skills || undefined,
          country: job.country,
          searchTerm: job.search_term || undefined,
          postedDate: job.posted_date || undefined,
          jobLevel: job.job_level_std || undefined,
          jobFunction: job.job_function_std || undefined,
          jobType: job.job_type_filled || undefined,
          companyIndustry: job.company_industry_std || undefined,
          platform: job.platform,
        }),
      });
      if (res.ok) {
        setApplyStatus((prev) => ({ ...prev, [jobKey]: "success" }));
        setTimeout(() => setApplyStatus((prev) => ({ ...prev, [jobKey]: "idle" })), 3000);
      } else {
        setApplyStatus((prev) => ({ ...prev, [jobKey]: "error" }));
        setTimeout(() => setApplyStatus((prev) => ({ ...prev, [jobKey]: "idle" })), 3000);
      }
    } catch {
      setApplyStatus((prev) => ({ ...prev, [jobKey]: "error" }));
      setTimeout(() => setApplyStatus((prev) => ({ ...prev, [jobKey]: "idle" })), 3000);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleViewJob = (job: Job) => {
    setSelectedJob(job);
    open();
  };

  const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 1;

  if (loading || !data) {
    return (
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Skeleton height={40} />
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} height={50} />
          ))}
        </Stack>
      </Paper>
    );
  }

  const { jobs, totalCount } = data;

  // Sort jobs
  const sortedJobs = [...jobs].sort((a, b) => {
    let aVal: any = a[sortBy as keyof Job];
    let bVal: any = b[sortBy as keyof Job];

    // Handle nullish values
    if (aVal === null || aVal === undefined) aVal = "";
    if (bVal === null || bVal === undefined) bVal = "";

    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });

  // Calculate pagination display range
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  // Slice jobs for current page
  const paginatedJobs = sortedJobs.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleViewDetails = (job: Job) => {
    setSelectedJob(job);
    open();
  };

  return (
    <>
      {/* Job Details Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={selectedJob?.actual_role}
        size="lg"
      >
        {selectedJob && (
          <Stack gap="md">
            <Group gap="xs">
              <IconBuilding size={16} />
              <Text fw={500}>{selectedJob.company_name}</Text>
            </Group>

            <Group gap="xs">
              <IconMapPin size={16} />
              <Text>{selectedJob.location || selectedJob.country}</Text>
            </Group>

            <Group gap="sm">
              <Badge
                color={
                  LEVEL_COLORS[selectedJob.job_level_std] || "gray"
                }
              >
                {selectedJob.job_level_std === "NA" ||
                selectedJob.job_level_std === ""
                  ? "Not Specified"
                  : selectedJob.job_level_std}
              </Badge>
              <Badge
                color={
                  FUNCTION_COLORS[selectedJob.job_function_std] || "gray"
                }
              >
                {selectedJob.job_function_std === "NA" ||
                selectedJob.job_function_std === ""
                  ? "Not Specified"
                  : selectedJob.job_function_std.replace(/_/g, " ")}
              </Badge>
              <PlatformBadge
                platform={selectedJob.platform}
                hasDuplicate={selectedJob.has_url_duplicate}
              />
              {selectedJob.is_remote && <Badge color="teal">Remote</Badge>}
              {selectedJob.is_research && (
                <Badge color="indigo">Research</Badge>
              )}
            </Group>

            {selectedJob.job_relevance_score !== null &&
              selectedJob.job_relevance_score !== undefined && (
                <>
                  <Divider />
                  <div>
                    <Text size="sm" fw={600} mb="xs">
                      Relevance Score
                    </Text>
                    <Group gap="md" align="center">
                      <Progress.Root size="lg" w={200} radius="xl">
                        <Progress.Section
                          value={
                            (selectedJob.job_relevance_score / 10) * 100
                          }
                          color={
                            selectedJob.job_relevance_score >= 8
                              ? "teal"
                              : selectedJob.job_relevance_score >= 6
                              ? "green"
                              : selectedJob.job_relevance_score >= 4
                              ? "yellow"
                              : selectedJob.job_relevance_score >= 2
                              ? "orange"
                              : "red"
                          }
                        />
                      </Progress.Root>
                      <Text
                        fw={600}
                        size="lg"
                        c={
                          selectedJob.job_relevance_score >= 8
                            ? "teal"
                            : selectedJob.job_relevance_score >= 6
                            ? "green"
                            : selectedJob.job_relevance_score >= 4
                            ? "yellow"
                            : selectedJob.job_relevance_score >= 2
                            ? "orange"
                            : "red"
                        }
                      >
                        {Math.round(selectedJob.job_relevance_score)} / 10
                      </Text>
                    </Group>
                  </div>
                </>
              )}

            <Divider />

            {selectedJob.education_level &&
              selectedJob.education_level !== "NA" && (
                <>
                  <div>
                    <Text size="sm" fw={600} mb="xs">
                      Education Requirements
                    </Text>
                    <Group gap={4}>
                      {selectedJob.education_level
                        .split(",")
                        .map((level, i) => (
                          <Badge key={i} color="indigo" variant="light">
                            {level.trim()}
                          </Badge>
                        ))}
                    </Group>
                  </div>
                  <Divider />
                </>
              )}

            <div>
              <Text size="sm" fw={600} mb="xs">
                Skills
              </Text>
              <Group gap={4}>
                {(() => {
                  const skills = selectedJob.skills
                    ?.split(",")
                    .map((s) => s.trim())
                    .filter((s) => s && s.toLowerCase() !== "na") || [];
                  return skills.length > 0 ? (
                    <>
                      {skills.slice(0, 20).map((skill, i) => (
                        <Badge key={i} size="sm" variant="light">
                          {skill}
                        </Badge>
                      ))}
                      {skills.length > 20 && (
                        <Badge size="sm" variant="outline">
                          +{skills.length - 20} more
                        </Badge>
                      )}
                    </>
                  ) : (
                    <Text size="sm" c="dimmed">
                      No skills listed
                    </Text>
                  );
                })()}
              </Group>
            </div>

            <Divider />

            <div>
              <Text size="sm" fw={600} mb="xs">
                Job Description
              </Text>
              {selectedJob.job_id && (
                <JobDescriptionSection job_id={selectedJob.job_id} />
              )}
            </div>

            <Group justify="space-between" mt="md">
              <Text size="xs" c="dimmed">
                Posted: {formatDate(selectedJob.posted_date)}
              </Text>
              <Group gap="sm">
                <Tooltip
                  label={
                    applyStatus[selectedJob._id] === "success"
                      ? "Added to Kanban!"
                      : applyStatus[selectedJob._id] === "error"
                      ? "Failed to add"
                      : applyStatus[selectedJob._id] === "duplicate"
                      ? "Already exists in Kanban"
                      : applyStatus[selectedJob._id] === "not-connected"
                      ? "Sign in to job-pilot first, then browse jobs from there"
                      : "Add to Kanban board"
                  }
                >
                  <ActionIcon
                    variant="light"
                    color={
                      applyStatus[selectedJob._id] === "success"
                        ? "green"
                        : applyStatus[selectedJob._id] === "error"
                        ? "red"
                        : applyStatus[selectedJob._id] === "duplicate"
                        ? "yellow"
                        : applyStatus[selectedJob._id] === "not-connected"
                        ? "gray"
                        : "violet"
                    }
                    size="lg"
                    loading={applyStatus[selectedJob._id] === "loading"}
                    onClick={() => handleApplyToKanban(selectedJob)}
                  >
                    {applyStatus[selectedJob._id] === "success" ? (
                      <IconCheck size={18} />
                    ) : applyStatus[selectedJob._id] === "error" ? (
                      <IconX size={18} />
                    ) : applyStatus[selectedJob._id] === "duplicate" ? (
                      <IconAlertTriangle size={18} />
                    ) : applyStatus[selectedJob._id] === "not-connected" ? (
                      <IconUserOff size={18} />
                    ) : (
                      <IconSend size={18} />
                    )}
                  </ActionIcon>
                </Tooltip>
                {selectedJob.url && (
                  <Anchor href={selectedJob.url} target="_blank" size="sm">
                    <Group gap={4}>
                      View Job <IconExternalLink size={14} />
                    </Group>
                  </Anchor>
                )}
              </Group>
            </Group>
          </Stack>
        )}
      </Modal>

      <Paper p="md" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={600}>
              <IconBriefcase
                size={18}
                style={{ verticalAlign: "middle", marginRight: 8 }}
              />
              Jobs ({totalCount.toLocaleString()} total)
            </Text>
            <Group gap="sm">
              <Text size="sm" c="dimmed">
                Rows per page:
              </Text>
              <Select
                size="xs"
                w={70}
                value={pageSize.toString()}
                onChange={(value) =>
                  setPageSize(parseInt(value || "20", 10))
                }
                data={["10", "20", "50", "100"]}
              />
            </Group>
          </Group>

          <Box style={{ overflowX: "auto" }}>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <SortableHeader
                    label="Relevance"
                    field="job_relevance_score"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Job / Company"
                    field="actual_role"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Level"
                    field="job_level_std"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Function"
                    field="job_function_std"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Country"
                    field="country"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Search Term"
                    field="search_term"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Source"
                    field="platform"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Posted"
                    field="posted_date"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedJobs.map((job: Job) => {
                  const jobLevel = job.job_level_std || "NA";
                  const jobFunction = job.job_function_std || "NA";

                  return (
                    <Table.Tr key={job._id}>
                      <Table.Td>
                        <RelevanceScore score={job.job_relevance_score} />
                      </Table.Td>
                      <Table.Td
                        style={{ maxWidth: 250 }}
                        title={`${job.actual_role} | ${job.company_name}`}
                      >
                        <Text size="sm" fw={500} lineClamp={1} title={job.actual_role}>
                          {job.actual_role}
                        </Text>
                        <Text size="xs" c="dimmed" lineClamp={1} title={job.company_name}>
                          {job.company_name}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="sm"
                          color={LEVEL_COLORS[jobLevel] || "gray"}
                        >
                          {jobLevel === "NA" || jobLevel === ""
                            ? "N/A"
                            : jobLevel.charAt(0).toUpperCase() +
                              jobLevel.slice(1)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="sm"
                          color={FUNCTION_COLORS[jobFunction] || "gray"}
                          variant="light"
                        >
                          {jobFunction === "NA" || jobFunction === ""
                            ? "N/A"
                            : jobFunction
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <IconMapPin size={14} />
                          <Text size="sm" lineClamp={1}>
                            {job.country}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {job.search_term || "N/A"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <PlatformBadge
                          platform={job.platform}
                          hasDuplicate={job.has_url_duplicate}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {formatDate(job.posted_date)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <Tooltip label="View Details">
                            <ActionIcon
                              variant="subtle"
                              onClick={() => handleViewJob(job)}
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip
                            label={
                              applyStatus[job._id] === "success"
                                ? "Added to Kanban!"
                                : applyStatus[job._id] === "error"
                                ? "Failed to add"
                                : applyStatus[job._id] === "duplicate"
                                ? "Already exists in Kanban"
                                : applyStatus[job._id] === "not-connected"
                                ? "Sign in to job-pilot first, then browse jobs from there"
                                : "Add to Kanban"
                            }
                          >
                            <ActionIcon
                              variant="subtle"
                              color={
                                applyStatus[job._id] === "success"
                                  ? "green"
                                  : applyStatus[job._id] === "error"
                                  ? "red"
                                  : applyStatus[job._id] === "duplicate"
                                  ? "yellow"
                                  : applyStatus[job._id] === "not-connected"
                                  ? "gray"
                                  : "violet"
                              }
                              loading={applyStatus[job._id] === "loading"}
                              onClick={() => handleApplyToKanban(job)}
                            >
                              {applyStatus[job._id] === "success" ? (
                                <IconCheck size={16} />
                              ) : applyStatus[job._id] === "error" ? (
                                <IconX size={16} />
                              ) : applyStatus[job._id] === "duplicate" ? (
                                <IconAlertTriangle size={16} />
                              ) : applyStatus[job._id] === "not-connected" ? (
                                <IconUserOff size={16} />
                              ) : (
                                <IconSend size={16} />
                              )}
                            </ActionIcon>
                          </Tooltip>
                          {job.url && (
                            <Tooltip label="Open Link">
                              <ActionIcon
                                variant="subtle"
                                component="a"
                                href={job.url}
                                target="_blank"
                              >
                                <IconExternalLink size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Box>

          <Group justify="space-between" align="center">
            <Group gap="sm">
              <Text size="sm" c="dimmed">
                Showing {startItem} - {endItem} of {totalCount}
              </Text>
              <Select
                size="xs"
                w={70}
                value={pageSize.toString()}
                onChange={(value) =>
                  setPageSize(parseInt(value || "20", 10))
                }
                data={["20", "50", "100"]}
              />
            </Group>
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              size="sm"
              withEdges
            />
          </Group>
        </Stack>
      </Paper>
    </>
  );
}

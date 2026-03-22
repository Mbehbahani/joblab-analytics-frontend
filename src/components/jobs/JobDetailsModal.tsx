"use client";

import {
  Anchor,
  Badge,
  Center,
  Divider,
  Group,
  Loader,
  Modal,
  Progress,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { IconBuilding, IconExternalLink, IconMapPin } from "@tabler/icons-react";
import { useJobDescription, useJobDetails } from "@/lib/hooks";

type JobDetails = {
  job_id?: string;
  actual_role?: string;
  company_name?: string;
  country?: string;
  location?: string;
  job_type_filled?: string;
  job_level_std?: string;
  job_function_std?: string;
  company_industry_std?: string;
  education_level?: string;
  is_remote?: boolean;
  is_research?: boolean;
  posted_date?: string | null;
  platform?: string;
  url?: string;
  skills?: string;
  job_relevance_score?: number | null;
  has_url_duplicate?: number;
};

const LEVEL_COLORS: Record<string, string> = {
  "Entry Level": "green",
  "Mid-Level": "blue",
  Associate: "cyan",
  Director: "red",
  Executive: "pink",
  Internship: "grape",
  "Not Specified": "gray",
  NA: "gray",
  "": "gray",
};

const FUNCTION_COLORS: Record<string, string> = {
  Engineering: "blue",
  "Data Science & Analytics": "violet",
  "Supply Chain & Logistics": "green",
  "Operations Research": "indigo",
  "Information Technology": "cyan",
  "Research & Development": "teal",
  "Sales & Marketing": "orange",
  Consulting: "grape",
  "Business & Finance": "yellow",
  Management: "pink",
  Education: "lime",
  "Product Management": "red",
  Healthcare: "rose",
  Other: "gray",
  NA: "gray",
  "": "gray",
};

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

  if ((platform || "").toLowerCase() === "linkedin") {
    return (
      <Badge size="xs" variant="light" color="blue">
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

function JobDescriptionSection({ jobId }: { jobId: string }) {
  const { description, isLoading } = useJobDescription(jobId);

  if (isLoading) {
    return (
      <Center py="md">
        <Loader size="sm" />
        <Text size="sm" c="dimmed" ml="xs">
          Loading description...
        </Text>
      </Center>
    );
  }

  if (!description) {
    return (
      <Text size="sm" c="dimmed" fs="italic">
        No description available
      </Text>
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

export function JobDetailsModal({
  opened,
  onClose,
  jobId,
}: {
  opened: boolean;
  onClose: () => void;
  jobId: string | null;
}) {
  const { job, isLoading } = useJobDetails(opened ? jobId : null);
  const selectedJob: JobDetails | null = job;

  return (
    <Modal opened={opened} onClose={onClose} title={selectedJob?.actual_role || "Job Details"} size="lg">
      {isLoading && !selectedJob ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : selectedJob ? (
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
            <Badge color={LEVEL_COLORS[selectedJob.job_level_std || ""] || "gray"}>
              {!selectedJob.job_level_std || selectedJob.job_level_std === "NA"
                ? "Not Specified"
                : selectedJob.job_level_std}
            </Badge>
            <Badge color={FUNCTION_COLORS[selectedJob.job_function_std || ""] || "gray"}>
              {!selectedJob.job_function_std || selectedJob.job_function_std === "NA"
                ? "Not Specified"
                : selectedJob.job_function_std.replace(/_/g, " ")}
            </Badge>
            <PlatformBadge
              platform={selectedJob.platform || ""}
              hasDuplicate={selectedJob.has_url_duplicate ?? 0}
            />
            {selectedJob.is_remote && <Badge color="teal">Remote</Badge>}
            {selectedJob.is_research && <Badge color="indigo">Research</Badge>}
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
                        value={(selectedJob.job_relevance_score / 10) * 100}
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

          {selectedJob.education_level && selectedJob.education_level !== "NA" && (
            <>
              <div>
                <Text size="sm" fw={600} mb="xs">
                  Education Requirements
                </Text>
                <Group gap={4}>
                  {selectedJob.education_level.split(",").map((level, i) => (
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
                const skills =
                  selectedJob.skills
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
            {selectedJob.job_id ? (
              <JobDescriptionSection jobId={selectedJob.job_id} />
            ) : (
              <Text size="sm" c="dimmed">
                No description available
              </Text>
            )}
          </div>

          <Group justify="space-between" mt="md">
            <Text size="xs" c="dimmed">
              Posted: {formatDate(selectedJob.posted_date)}
            </Text>
            {selectedJob.url && (
              <Anchor href={selectedJob.url} target="_blank" size="sm">
                <Group gap={4}>
                  View Job <IconExternalLink size={14} />
                </Group>
              </Anchor>
            )}
          </Group>
        </Stack>
      ) : (
        <Text size="sm" c="dimmed">
          Job details are unavailable.
        </Text>
      )}
    </Modal>
  );
}

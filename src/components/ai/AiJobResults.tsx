"use client";

import { ActionIcon, Badge, Box, Group, Paper, Stack, Text, Tooltip, useMantineColorScheme } from "@mantine/core";
import { IconBuilding, IconExternalLink, IconEye, IconMapPin } from "@tabler/icons-react";
import type { AiJobResult } from "@/lib/useAiSearch";

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

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
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

export function AiJobResults({
  jobs,
  onViewDetails,
}: {
  jobs: AiJobResult[];
  onViewDetails: (jobId: string) => void;
}) {
  const { colorScheme } = useMantineColorScheme();

  if (!jobs.length) {
    return null;
  }

  return (
    <Stack gap="sm">
      <Text size="xs" c="dimmed">
        {jobs.length} result{jobs.length !== 1 ? "s" : ""} found
      </Text>

      {jobs.map((job) => (
        <Paper
          key={job.job_id}
          p="sm"
          withBorder
          onClick={() => onViewDetails(job.job_id)}
          style={{
            backgroundColor:
              colorScheme === "dark"
                ? "var(--mantine-color-dark-6)"
                : "var(--mantine-color-gray-0)",
            cursor: "pointer",
          }}
        >
          <Stack gap={6}>
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Box style={{ flex: 1 }}>
                <Text fw={600} size="sm" lineClamp={2}>
                  {job.actual_role || "Untitled role"}
                </Text>
                <Group gap={4} mt={2}>
                  <IconBuilding size={13} style={{ color: "var(--mantine-color-dimmed)" }} />
                  <Text size="xs" c="dimmed">
                    {job.company_name || "Unknown company"}
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
                      onViewDetails(job.job_id);
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

            <Group gap="xs">
              <Group gap={4}>
                <IconMapPin size={12} style={{ color: "var(--mantine-color-dimmed)" }} />
                <Text size="xs" c="dimmed">
                  {job.location || job.country || "-"}
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

            <Text size="xs" c="dimmed" ff="monospace">
              ID: {job.job_id}
            </Text>

            {job.tools && (
              <Text size="xs" c="dimmed" lineClamp={2}>
                Tools: {job.tools}
              </Text>
            )}

            {job.skills && (
              <Text size="xs" c="dimmed" lineClamp={2}>
                Skills: {job.skills}
              </Text>
            )}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

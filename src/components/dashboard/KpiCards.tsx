"use client";

import { SimpleGrid, Paper, Text, Group, ThemeIcon, Skeleton, Stack } from "@mantine/core";
import {
  IconBriefcase,
  IconBuilding,
  IconWorld,
  IconFlask,
} from "@tabler/icons-react";
import { KpiData } from "@/types/dashboard";

type Props = {
  data: KpiData | undefined;
  loading?: boolean;
};

const kpiConfig = [
  {
    key: "totalJobs",
    label: "Unique Jobs",
    icon: IconBriefcase,
    color: "blue",
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "countriesCount",
    label: "Countries",
    icon: IconWorld,
    color: "violet",
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "uniqueCompanies",
    label: "Companies",
    icon: IconBuilding,
    color: "green",
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "researchShare",
    label: "Research",
    icon: IconFlask,
    color: "orange",
    format: (v: number) => `${v.toFixed(1)}%`,
  },
] as const;

export function KpiCards({ data, loading }: Props) {
  if (loading || !data) {
    return (
      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        {kpiConfig.map((kpi) => (
          <Paper key={kpi.key} p="md" withBorder>
            <Group justify="space-between" align="flex-start">
              <Stack gap={4}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {kpi.label}
                </Text>
                <Skeleton height={32} width={80} />
              </Stack>
              <ThemeIcon color={kpi.color} variant="light" size="lg">
                <kpi.icon size={20} />
              </ThemeIcon>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>
    );
  }

  return (
    <SimpleGrid cols={{ base: 2, sm: 4 }}>
      {kpiConfig.map((kpi) => (
        <Paper key={kpi.key} p="md" withBorder>
          <Group justify="space-between" align="flex-start">
            <Stack gap={4}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                {kpi.label}
              </Text>
              <Text size="xl" fw={700}>
                {kpi.format(data[kpi.key])}
              </Text>
            </Stack>
            <ThemeIcon color={kpi.color} variant="light" size="lg">
              <kpi.icon size={20} />
            </ThemeIcon>
          </Group>
        </Paper>
      ))}
    </SimpleGrid>
  );
}

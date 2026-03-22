/**
 * AiInsightPanel — Left-side drawer that shows a chart
 * based on the AI's tool_calls analysis.
 */

"use client";

import {
  Drawer,
  Stack,
  Text,
  Group,
  Paper,
  Loader,
  Badge,
  Alert,
  ActionIcon,
  Tooltip,
  Center,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconChartBar,
  IconX,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useAiInsightStore } from "@/store/aiInsightStore";
import { useAiInsightData } from "@/lib/useAiInsightData";
import type { ChartType } from "@/lib/chartRecommender";
import { IconInfoCircle } from "@tabler/icons-react";

// Chart components
import { CountryRemoteChart } from "@/components/charts/CountryRemoteChart";
import { CountryMapChart } from "@/components/charts/CountryMapChart";
import { JobFunctionBarChart } from "@/components/charts/JobFunctionBarChart";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { StackedJobTypeChart } from "@/components/charts/StackedJobTypeChart";
import { HeatmapChart } from "@/components/charts/HeatmapChart";

// ── Chart renderer ─────────────────────────────────────────────────────────

function RenderChart({
  chartType,
  data,
  loading,
}: {
  chartType: ChartType;
  data: unknown;
  loading: boolean;
}) {
  switch (chartType) {
    case "CountryRemoteChart":
      return (
        <CountryRemoteChart
          data={data as { country: string; is_remote: string; count: number }[] | undefined}
          loading={loading}
        />
      );
    case "CountryMapChart":
      return (
        <CountryMapChart
          data={data as { country: string; count: number }[] | undefined}
          loading={loading}
        />
      );
    case "JobFunctionBarChart":
      return (
        <JobFunctionBarChart
          data={data as { job_function_std: string; count: number }[] | undefined}
          loading={loading}
        />
      );
    case "TimeSeriesChart":
      return (
        <TimeSeriesChart
          data={data as { date: string; count: number }[] | undefined}
          loading={loading}
        />
      );
    case "StackedJobTypeChart":
      return (
        <StackedJobTypeChart
          data={
            data as
              | { job_type_filled: string; job_level_std: string; count: number }[]
              | undefined
          }
          loading={loading}
        />
      );
    case "HeatmapChart":
      return (
        <HeatmapChart
          data={
            data as
              | { country: string; job_function_std: string; count: number }[]
              | undefined
          }
          loading={loading}
        />
      );
    default:
      return null;
  }
}

// ── Panel component ────────────────────────────────────────────────────────

export function AiInsightPanel() {
  const { recommendation, noChartReason, panelOpen, closePanel } = useAiInsightStore();
  const { data, isLoading, error } = useAiInsightData();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Drawer
      opened={panelOpen}
      onClose={closePanel}
      title={
        <Group gap="xs">
          <IconChartBar
            size={20}
            style={{ color: "var(--mantine-color-teal-5)" }}
          />
          <Text fw={600} size="lg">
            AI Insight
          </Text>
          <Badge size="xs" variant="light" color="teal">
            Chart
          </Badge>
        </Group>
      }
      position="left"
      size="lg"
      padding="lg"
      withCloseButton={false}
    >
      <Stack gap="md" h="100%">
        {/* Header with title and close button */}
        <Group justify="space-between" align="flex-start">
          <div style={{ flex: 1 }}>
            <Text
              size="sm"
              fw={600}
              c={isDark ? "gray.2" : "dark.7"}
            >
              {recommendation?.title ?? "Insight Chart"}
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              Auto-generated from your query
            </Text>
          </div>
          <Tooltip label="Close panel">
            <ActionIcon variant="subtle" size="sm" onClick={closePanel}>
              <IconX size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>

        {/* Chart area */}
        <Paper
          p="md"
          withBorder
          style={{
            flex: 1,
            minHeight: 350,
            backgroundColor: isDark
              ? "var(--mantine-color-dark-6)"
              : "var(--mantine-color-white)",
          }}
        >
          {error ? (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Failed to load chart data"
              color="red"
              variant="light"
            >
              <Text size="sm">Could not fetch data for this visualization.</Text>
            </Alert>
          ) : isLoading && !data ? (
            <Center h={300}>
              <Stack align="center" gap="sm">
                <Loader size="md" color="teal" />
                <Text size="sm" c="dimmed">
                  Loading chart data…
                </Text>
              </Stack>
            </Center>
          ) : recommendation ? (
            <RenderChart
              chartType={recommendation.chartType}
              data={data}
              loading={isLoading}
            />
          ) : noChartReason ? (
            <Alert
              icon={<IconInfoCircle size={16} />}
              title="No chart for this query"
              color="blue"
              variant="light"
              mt="md"
            >
              <Text size="sm">{noChartReason}</Text>
            </Alert>
          ) : (
            <Center h={300}>
              <Text size="sm" c="dimmed">
                No chart available
              </Text>
            </Center>
          )}
        </Paper>

        {/* Filter context */}
        {recommendation?.filters && (
          <Paper
            p="sm"
            withBorder
            style={{
              backgroundColor: isDark
                ? "var(--mantine-color-dark-7)"
                : "var(--mantine-color-gray-0)",
            }}
          >
            <Text size="xs" fw={500} c="dimmed" mb={4}>
              Applied Filters
            </Text>
            <Group gap="xs" wrap="wrap">
              {recommendation.filters.country?.map((c) => (
                <Badge key={c} size="sm" variant="outline" color="blue">
                  {c}
                </Badge>
              ))}
              {recommendation.filters.is_remote === true && (
                <Badge size="sm" variant="outline" color="green">
                  Remote
                </Badge>
              )}
              {recommendation.filters.is_remote === false && (
                <Badge size="sm" variant="outline" color="orange">
                  On-site
                </Badge>
              )}
              {recommendation.filters.posted_date_range && (
                <Badge size="sm" variant="outline" color="grape">
                  {recommendation.filters.posted_date_range[0]} → {recommendation.filters.posted_date_range[1]}
                </Badge>
              )}
              {recommendation.filters.job_function_std?.map((f) => (
                <Badge key={f} size="sm" variant="outline" color="cyan">
                  {f}
                </Badge>
              ))}
              {recommendation.filters.job_level_std?.map((l) => (
                <Badge key={l} size="sm" variant="outline" color="yellow">
                  {l}
                </Badge>
              ))}
            </Group>
          </Paper>
        )}
      </Stack>
    </Drawer>
  );
}

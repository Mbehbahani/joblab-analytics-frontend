"use client";

import ReactECharts from "echarts-for-react";
import { useFilterStore } from "@/store/filterStore";
import { commonChartOptions, getTooltipStyle, getTextColor, getAxisColor, getGridColor, CHART_COLORS } from "./chartConfig";
import { Skeleton, useMantineColorScheme, Button, Group, Text } from "@mantine/core";
import { IconRefresh, IconCheck } from "@tabler/icons-react";
import { useState, useRef, useCallback } from "react";

type Props = {
  data: { date: string; count: number }[] | undefined;
  loading?: boolean;
};

export function TimeSeriesChart({ data, loading }: Props) {
  const setDateRange = useFilterStore((s) => s.setDateRange);
  const currentRange = useFilterStore((s) => s.filters.posted_date_range);
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  
  // Local state for pending selection (not yet applied)
  const [pendingRange, setPendingRange] = useState<[string, string] | null>(null);
  const chartRef = useRef<any>(null);

  if (loading || !data || data.length === 0) {
    return <Skeleton height={300} />;
  }

  // Sort by date
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const dates = sortedData.map((d) => d.date);
  const counts = sortedData.map((d) => d.count);

  // Determine selected range indices (use pending if exists, otherwise current)
  const displayRange = pendingRange || currentRange;
  let startIndex = 0;
  let endIndex = dates.length - 1;
  if (displayRange) {
    const startIdx = dates.findIndex((d) => d >= displayRange[0]);
    const endIdx = dates.findIndex((d) => d > displayRange[1]);
    if (startIdx >= 0) startIndex = startIdx;
    if (endIdx >= 0) endIndex = endIdx - 1;
    else endIndex = dates.length - 1;
  }

  const option = {
    ...commonChartOptions,
    tooltip: {
      ...getTooltipStyle(isDark),
      trigger: "axis",
      formatter: (params: any) => {
        const item = params[0];
        const date = item.axisValue.split(' ')[0]; // Remove time portion
        return `<strong>${date}</strong><br/>Jobs Created: ${item.value}`;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "20%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: {
        fontSize: 10,
        rotate: 45,
        color: getTextColor(isDark),
        formatter: (value: string) => {
          // Format date for display - remove time portion
          const dateOnly = value.split(' ')[0]; // Get date part only
          return dateOnly.substring(5); // MM-DD format
        },
      },
      axisLine: { lineStyle: { color: getAxisColor(isDark) } },
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      axisLabel: { fontSize: 11, color: getTextColor(isDark) },
      axisLine: { lineStyle: { color: getAxisColor(isDark) } },
      splitLine: { lineStyle: { color: getGridColor(isDark) } },
      name: "Jobs",
      nameLocation: "middle",
      nameGap: 40,
      nameTextStyle: { color: getTextColor(isDark) },
    },
    dataZoom: [
      {
        type: "slider",
        xAxisIndex: 0,
        start: (startIndex / Math.max(dates.length - 1, 1)) * 100,
        end: (endIndex / Math.max(dates.length - 1, 1)) * 100,
        bottom: "5%",
        height: 30,
        borderColor: isDark ? "#444" : "#ddd",
        fillerColor: "rgba(84, 112, 198, 0.2)",
        handleStyle: {
          color: "#5470c6",
        },
        textStyle: { color: getTextColor(isDark) },
        dataBackground: {
          lineStyle: { color: isDark ? "#555" : "#ccc" },
          areaStyle: { color: isDark ? "#333" : "#eee" },
        },
      },
      {
        type: "inside",
        xAxisIndex: 0,
        start: (startIndex / Math.max(dates.length - 1, 1)) * 100,
        end: (endIndex / Math.max(dates.length - 1, 1)) * 100,
      },
    ],
    series: [
      {
        name: "Jobs Posted",
        type: "line",
        data: counts,
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: {
          color: CHART_COLORS.primary[0],
          width: 2,
        },
        itemStyle: {
          color: CHART_COLORS.primary[0],
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(84, 112, 198, 0.4)" },
              { offset: 1, color: "rgba(84, 112, 198, 0.05)" },
            ],
          },
        },
        emphasis: {
          itemStyle: {
            borderWidth: 3,
          },
        },
      },
    ],
    brush: {
      toolbox: ["lineX", "clear"],
      xAxisIndex: 0,
      brushStyle: {
        borderWidth: 1,
        color: "rgba(84, 112, 198, 0.2)",
        borderColor: "rgba(84, 112, 198, 0.8)",
      },
    },
    toolbox: {
      right: 10,
      iconStyle: {
        borderColor: getTextColor(isDark),
      },
      feature: {
        dataZoom: {
          yAxisIndex: "none",
          title: {
            zoom: "Zoom",
            back: "Reset Zoom",
          },
        },
        brush: {
          type: ["lineX", "clear"],
          title: {
            lineX: "Select Range",
            clear: "Clear Selection",
          },
        },
      },
    },
  };

  const onEvents = {
    datazoom: (params: any) => {
      // Handle both slider and inside zoom - set pending range (not applied yet)
      const zoomParams = params.batch ? params.batch[0] : params;
      const start = Math.floor((zoomParams.start / 100) * (dates.length - 1));
      const end = Math.ceil((zoomParams.end / 100) * (dates.length - 1));
      
      if (dates[start] && dates[end]) {
        setPendingRange([dates[start], dates[end]]);
      }
    },
    brushselected: (params: any) => {
      const areas = params.batch?.[0]?.areas;
      if (areas && areas.length > 0) {
        const range = areas[0].coordRange;
        if (range && dates[range[0]] && dates[range[1]]) {
          setPendingRange([dates[range[0]], dates[range[1]]]);
        }
      }
    },
    brushEnd: (params: any) => {
      // Handle brush end if needed
      if (params.areas && params.areas.length === 0) {
        // Brush was cleared
        setPendingRange(null);
      }
    },
  };

  // Apply the pending range as filter
  const applyFilter = () => {
    if (pendingRange) {
      setDateRange(pendingRange);
      setPendingRange(null);
    }
  };

  // Reset to show all data
  const resetFilter = () => {
    setDateRange(null);
    setPendingRange(null);
    // Reset the chart zoom to full range
    if (chartRef.current) {
      const chart = chartRef.current.getEchartsInstance();
      chart.dispatchAction({
        type: 'dataZoom',
        start: 0,
        end: 100,
      });
    }
  };

  // Check if there's a pending change
  const hasPendingChange = pendingRange !== null && 
    (!currentRange || 
     pendingRange[0] !== currentRange[0] || 
     pendingRange[1] !== currentRange[1]);

  return (
    <div>
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ height: "300px", width: "100%" }}
        onEvents={onEvents}
        notMerge={true}
      />
      <Group justify="space-between" mt="xs">
        <Text size="xs" c="dimmed">
          {pendingRange 
            ? `Selected: ${pendingRange[0]} to ${pendingRange[1]}`
            : currentRange 
              ? `Filtered: ${currentRange[0]} to ${currentRange[1]}`
              : "Drag slider to select date range"
          }
        </Text>
        <Group gap="xs">
          {hasPendingChange && (
            <Button
              size="xs"
              variant="filled"
              color="blue"
              leftSection={<IconCheck size={14} />}
              onClick={applyFilter}
            >
              Apply Filter
            </Button>
          )}
          {(currentRange || pendingRange) && (
            <Button
              size="xs"
              variant="light"
              color="gray"
              leftSection={<IconRefresh size={14} />}
              onClick={resetFilter}
            >
              Reset
            </Button>
          )}
        </Group>
      </Group>
    </div>
  );
}

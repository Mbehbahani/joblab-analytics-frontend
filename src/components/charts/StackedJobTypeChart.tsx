"use client";

import ReactECharts from "echarts-for-react";
import { useFilterStore } from "@/store/filterStore";
import { getColor, commonChartOptions, getTooltipStyle, getTextColor, getAxisColor, getGridColor } from "./chartConfig";
import { Skeleton, useMantineColorScheme } from "@mantine/core";

type Props = {
  data: { job_type_filled: string; job_level_std: string; count: number }[] | undefined;
  loading?: boolean;
};

export function StackedJobTypeChart({ data, loading }: Props) {
  const toggleFilterValue = useFilterStore((s) => s.toggleFilterValue);
  const selectedLevels = useFilterStore((s) => s.filters.job_level_std) || [];
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  if (loading || !data || data.length === 0) {
    return <Skeleton height={350} />;
  }

  // Get unique job types and levels
  const jobTypes = [...new Set(data.map((d) => d.job_type_filled))];
  const jobLevels = [...new Set(data.map((d) => d.job_level_std))];

  // Check for empty data
  if (jobTypes.length === 0 || jobLevels.length === 0) {
    return <Skeleton height={350} />;
  }

  // Create data matrix
  const series = jobLevels.map((level) => {
    const levelData = jobTypes.map((type) => {
      const item = data.find((d) => d.job_type_filled === type && d.job_level_std === level);
      return item?.count || 0;
    });

    const isSelected = selectedLevels.length === 0 || selectedLevels.includes(level);

    return {
      name: level,
      type: "bar" as const,
      stack: "total",
      data: levelData,
      emphasis: {
        focus: "series" as const,
      },
      itemStyle: {
        color: getColor("jobLevel", level),
        opacity: isSelected ? 1 : 0.3,
      },
    };
  });

  const option = {
    ...commonChartOptions,
    tooltip: {
      ...getTooltipStyle(isDark),
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: any) => {
        let html = `<strong>${params[0].axisValue}</strong><br/>`;
        params.forEach((param: any) => {
          if (param.value > 0) {
            html += `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${param.color};margin-right:5px;"></span>${param.seriesName}: ${param.value}<br/>`;
          }
        });
        return html;
      },
    },
    legend: {
      type: "scroll",
      bottom: 0,
      itemWidth: 14,
      itemHeight: 14,
      textStyle: { fontSize: 11, color: getTextColor(isDark) },
      pageTextStyle: { color: getTextColor(isDark) },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: jobTypes,
      axisLabel: { fontSize: 11, color: getTextColor(isDark) },
      axisLine: { lineStyle: { color: getAxisColor(isDark) } },
    },
    yAxis: {
      type: "value",
      axisLabel: { fontSize: 11, color: getTextColor(isDark) },
      axisLine: { lineStyle: { color: getAxisColor(isDark) } },
      splitLine: { lineStyle: { color: getGridColor(isDark) } },
    },
    series,
  };

  const onChartClick = (params: any) => {
    if (params.componentType === "series") {
      // Click on a bar segment - toggle the job level filter
      toggleFilterValue("job_level_std", params.seriesName);
    }
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "350px", width: "100%" }}
      onEvents={{ click: onChartClick }}
      notMerge={true}
    />
  );
}

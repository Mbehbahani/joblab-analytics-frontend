"use client";

import ReactECharts from "echarts-for-react";
import { useFilterStore } from "@/store/filterStore";
import { getColor, commonChartOptions, getTooltipStyle, getTextColor, getAxisColor, getGridColor } from "./chartConfig";
import { Skeleton, useMantineColorScheme } from "@mantine/core";

type Props = {
  data: { job_function_std: string; count: number }[] | undefined;
  loading?: boolean;
};

export function JobFunctionBarChart({ data, loading }: Props) {
  const toggleFilterValue = useFilterStore((s) => s.toggleFilterValue);
  const selectedFunctions = useFilterStore((s) => s.filters.job_function_std) || [];
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  if (loading || !data || data.length === 0) {
    return <Skeleton height={400} />;
  }

  // Sort by count descending
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  const option = {
    ...commonChartOptions,
    tooltip: {
      ...getTooltipStyle(isDark),
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: any) => {
        const item = params[0];
        return `<strong>${item.name}</strong><br/>Jobs: ${item.value}`;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      axisLabel: { fontSize: 11, color: getTextColor(isDark) },
      axisLine: { lineStyle: { color: getAxisColor(isDark) } },
      splitLine: { lineStyle: { color: getGridColor(isDark) } },
    },
    yAxis: {
      type: "category",
      data: sortedData.map((d) => d.job_function_std),
      axisLabel: {
        fontSize: 11,
        width: 120,
        overflow: "truncate",
        color: getTextColor(isDark),
      },
      axisLine: { lineStyle: { color: getAxisColor(isDark) } },
      inverse: true,
    },
    series: [
      {
        name: "Jobs",
        type: "bar",
        data: sortedData.map((d) => ({
          value: d.count,
          itemStyle: {
            color: getColor("jobFunction", d.job_function_std),
            opacity: selectedFunctions.length === 0 || selectedFunctions.includes(d.job_function_std) ? 1 : 0.3,
          },
        })),
        label: {
          show: true,
          position: "right",
          fontSize: 10,
          color: getTextColor(isDark),
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0,0,0,0.3)",
          },
        },
      },
    ],
  };

  const onChartClick = (params: any) => {
    if (params.componentType === "series") {
      toggleFilterValue("job_function_std", params.name);
    }
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "400px", width: "100%" }}
      onEvents={{ click: onChartClick }}
      notMerge={true}
    />
  );
}

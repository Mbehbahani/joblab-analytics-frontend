"use client";

import ReactECharts from "echarts-for-react";
import { useFilterStore } from "@/store/filterStore";
import { commonChartOptions, getTooltipStyle, getTextColor, getAxisColor, getGridColor } from "./chartConfig";
import { Skeleton, useMantineColorScheme } from "@mantine/core";

type Props = {
  data: { country: string; count: number }[] | undefined;
  loading?: boolean;
};

// Simple world map representation using scatter on a geo coordinate system
// For full map support, you would need to register a map with ECharts
// This uses a bar chart as an alternative visualization

export function CountryMapChart({ data, loading }: Props) {
  const toggleFilterValue = useFilterStore((s) => s.toggleFilterValue);
  const selectedCountries = useFilterStore((s) => s.filters.country) || [];
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  if (loading || !data || data.length === 0) {
    return <Skeleton height={350} />;
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
      data: sortedData.map((d) => d.country),
      axisLabel: {
        fontSize: 11,
        width: 80,
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
        data: sortedData.map((d, index) => ({
          value: d.count,
          itemStyle: {
            color: `hsl(${200 + index * 15}, 70%, ${55 - index * 3}%)`,
            opacity: selectedCountries.length === 0 || selectedCountries.includes(d.country) ? 1 : 0.3,
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
      toggleFilterValue("country", params.name);
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

"use client";

import { Skeleton, useMantineColorScheme } from "@mantine/core";
import ReactECharts from "echarts-for-react";
import { useFilterStore } from "@/store/filterStore";
import { getTooltipStyle, getTextColor, getAxisColor, getGridColor, getColor } from "./chartConfig";

type SearchTermData = {
  search_term: string;
  count: number;
};

type Props = {
  data: SearchTermData[] | undefined;
  loading?: boolean;
};

export function SearchTermChart({ data, loading }: Props) {
  const toggleFilterValue = useFilterStore((s) => s.toggleFilterValue);
  const selectedSearchTerms = useFilterStore((s) => s.filters.search_term) || [];
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  if (loading || !data) {
    return <Skeleton height={300} />;
  }

  // Filter out "Unknown" and take top items
  const filteredData = data.filter(d => d.search_term !== "Unknown");
  const sortedData = [...filteredData].sort((a, b) => b.count - a.count).slice(0, 15);

  // Check if we have data after filtering
  if (sortedData.length === 0) {
    return <Skeleton height={300} />;
  }

  const option = {
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
      data: sortedData.map((d) => d.search_term),
      axisLabel: {
        fontSize: 11,
        width: 140,
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
            color: getColor("searchTerm", d.search_term),
            opacity: selectedSearchTerms.length === 0 || selectedSearchTerms.includes(d.search_term) ? 1 : 0.3,
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
      toggleFilterValue("search_term", params.name);
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

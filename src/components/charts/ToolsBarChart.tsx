"use client";

import { Skeleton, useMantineColorScheme } from "@mantine/core";
import ReactECharts from "echarts-for-react";
import { useFilterStore } from "@/store/filterStore";
import { getTooltipStyle, getTextColor, getAxisColor, getGridColor } from "./chartConfig";

type ToolData = {
  tool: string;
  count: number;
};

type Props = {
  data: ToolData[] | undefined;
  loading?: boolean;
};

export function ToolsBarChart({ data, loading }: Props) {
  const toggleFilterValue = useFilterStore((s) => s.toggleFilterValue);
  const selectedTools = useFilterStore((s) => s.filters.tools) || [];
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  if (loading || !data || data.length === 0) {
    return <Skeleton height={300} />;
  }

  const maxCount = data[0]?.count || 1;

  const option = {
    tooltip: {
      ...getTooltipStyle(isDark),
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: any) => {
        const d = params[0];
        return `<strong>${d.name}</strong><br/>Jobs: ${d.value}`;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      axisLabel: {
        fontSize: 10,
        color: getTextColor(isDark),
      },
      axisLine: { lineStyle: { color: getAxisColor(isDark) } },
      splitLine: { lineStyle: { color: getGridColor(isDark) } },
    },
    yAxis: {
      type: "category",
      data: data.map(d => d.tool).reverse(),
      axisLabel: {
        fontSize: 11,
        width: 110,
        overflow: "truncate",
        color: getTextColor(isDark),
      },
      axisLine: { lineStyle: { color: getAxisColor(isDark) } },
    },
    series: [
      {
        name: "Jobs",
        type: "bar",
        data: data
          .map(d => ({
            name: d.tool,
            value: d.count,
            itemStyle: {
              color: (() => {
                const ratio = d.count / maxCount;
                // Gradient from light teal to deep teal-green
                const r = Math.round(20 + (1 - ratio) * 120);
                const g = Math.round(184 + (1 - ratio) * 40);
                const b = Math.round(166 - (1 - ratio) * 40);
                return `rgb(${r}, ${g}, ${b})`;
              })(),
              borderRadius: [0, 4, 4, 0],
              opacity: selectedTools.length === 0 || selectedTools.includes(d.tool) ? 1 : 0.3,
            },
          }))
          .reverse(),
        cursor: "pointer",
        emphasis: {
          itemStyle: {
            color: "#12b886",
            shadowBlur: 10,
            shadowColor: "rgba(0,0,0,0.3)",
          },
        },
        label: {
          show: true,
          position: "right",
          fontSize: 10,
          formatter: "{c}",
          color: getTextColor(isDark),
        },
      },
    ],
  };

  const onChartClick = (params: any) => {
    if (params.componentType === "series") {
      toggleFilterValue("tools", params.name);
    }
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "100%", minHeight: 300 }}
      opts={{ renderer: "canvas" }}
      onEvents={{ click: onChartClick }}
      notMerge={true}
    />
  );
}

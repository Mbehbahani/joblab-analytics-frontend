"use client";

import ReactECharts from "echarts-for-react";
import { useFilterStore } from "@/store/filterStore";
import { commonChartOptions, CHART_COLORS } from "./chartConfig";
import { Skeleton, useMantineColorScheme } from "@mantine/core";

type Props = {
  data: { data: any[]; functions: string[] } | undefined;
  loading?: boolean;
};

export function IndustryFunctionChart({ data, loading }: Props) {
  const toggleFilterValue = useFilterStore((s) => s.toggleFilterValue);
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  if (loading || !data || data.data.length === 0) {
    return <Skeleton height={400} />;
  }

  const { data: chartData, functions } = data;
  const industries = chartData.map((d) => d.industry);

  // Build series for each function
  const series = functions.map((func, index) => ({
    name: func,
    type: "bar",
    stack: "total",
    emphasis: {
      focus: "series",
    },
    data: chartData.map((d) => d[func] || 0),
    itemStyle: {
      color: CHART_COLORS.primary[index % CHART_COLORS.primary.length],
    },
  }));

  const option = {
    ...commonChartOptions,
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      backgroundColor: isDark ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
      borderColor: isDark ? "#444" : "#ccc",
      textStyle: {
        color: isDark ? "#e0e0e0" : "#333",
      },
      formatter: (params: any) => {
        let html = `<strong>${params[0].axisValue}</strong><br/>`;
        let total = 0;
        params.forEach((p: any) => {
          if (p.value > 0) {
            html += `<span style="display:inline-block;width:10px;height:10px;background:${p.color};border-radius:50%;margin-right:5px;"></span>${p.seriesName}: ${p.value}<br/>`;
            total += p.value;
          }
        });
        html += `<strong>Total: ${total}</strong>`;
        return html;
      },
    },
    legend: {
      type: "scroll",
      bottom: 0,
      textStyle: {
        color: isDark ? "#c1c2c5" : "#333",
        fontSize: 11,
      },
      pageTextStyle: {
        color: isDark ? "#c1c2c5" : "#333",
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      top: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: industries,
      axisLabel: {
        rotate: 30,
        fontSize: 10,
        interval: 0,
        color: isDark ? "#c1c2c5" : "#666",
        formatter: (value: string) => {
          return value.length > 18 ? value.slice(0, 18) + "..." : value;
        },
      },
      axisLine: {
        lineStyle: {
          color: isDark ? "#444" : "#ccc",
        },
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: isDark ? "#c1c2c5" : "#666",
      },
      splitLine: {
        lineStyle: {
          color: isDark ? "#333" : "#eee",
        },
      },
    },
    series,
  };

  const onChartClick = (params: any) => {
    if (params.componentType === "series") {
      // Click on bar - filter by both industry and function
      if (params.seriesName && params.seriesName !== "Other") {
        toggleFilterValue("job_function_std", params.seriesName);
      }
    }
  };

  const onLegendClick = (params: any) => {
    // Legend click - filter by function
    if (params.name && params.name !== "Other") {
      toggleFilterValue("job_function_std", params.name);
    }
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "400px", width: "100%" }}
      onEvents={{
        click: onChartClick,
        legendselectchanged: onLegendClick,
      }}
      notMerge={true}
    />
  );
}

"use client";

import ReactECharts from "echarts-for-react";
import { useFilterStore } from "@/store/filterStore";
import { commonChartOptions, getTooltipStyle, getTextColor, getAxisColor } from "./chartConfig";
import { Skeleton, useMantineColorScheme } from "@mantine/core";

type Props = {
  data: { country: string; job_function_std: string; count: number }[] | undefined;
  loading?: boolean;
};

export function HeatmapChart({ data, loading }: Props) {
  const toggleFilterValue = useFilterStore((s) => s.toggleFilterValue);
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  if (loading || !data || data.length === 0) {
    return <Skeleton height={400} />;
  }

  // Get unique countries and functions
  const countries = [...new Set(data.map((d) => d.country))].sort();
  const functions = [...new Set(data.map((d) => d.job_function_std))].sort();

  // Additional check for empty countries or functions
  if (countries.length === 0 || functions.length === 0) {
    return <Skeleton height={400} />;
  }

  // Create heatmap data: [countryIndex, functionIndex, value]
  const heatmapData = data.map((d) => {
    const countryIdx = countries.indexOf(d.country);
    const funcIdx = functions.indexOf(d.job_function_std);
    return [countryIdx, funcIdx, d.count];
  });

  const maxValue = Math.max(...data.map((d) => d.count), 1);

  const option = {
    ...commonChartOptions,
    tooltip: {
      ...getTooltipStyle(isDark),
      position: "top",
      formatter: (params: any) => {
        const country = countries[params.value[0]];
        const func = functions[params.value[1]];
        const count = params.value[2];
        return `<strong>${country}</strong><br/>${func}: ${count} jobs`;
      },
    },
    grid: {
      left: "15%",
      right: "12%",
      bottom: "20%",
      top: "5%",
      containLabel: false,
    },
    xAxis: {
      type: "category",
      data: countries,
      splitArea: { show: true },
      axisLabel: {
        fontSize: 10,
        rotate: 45,
        interval: 0,
        color: getTextColor(isDark),
      },
      axisLine: { lineStyle: { color: getAxisColor(isDark) } },
    },
    yAxis: {
      type: "category",
      data: functions,
      splitArea: { show: true },
      axisLabel: {
        fontSize: 10,
        width: 100,
        overflow: "truncate",
        color: getTextColor(isDark),
      },
      axisLine: { lineStyle: { color: getAxisColor(isDark) } },
    },
    visualMap: {
      min: 0,
      max: maxValue,
      calculable: true,
      orient: "vertical",
      right: "2%",
      top: "center",
      inRange: {
        color: isDark 
          ? ["#1a365d", "#2a4a7f", "#3b5ea0", "#4c72c1", "#6b8dd6", "#8ba7eb", "#abc1ff"]
          : ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#084594"],
      },
      textStyle: { fontSize: 10, color: getTextColor(isDark) },
    },
    series: [
      {
        name: "Jobs",
        type: "heatmap",
        data: heatmapData,
        label: {
          show: true,
          formatter: (params: any) => (params.value[2] > 0 ? params.value[2] : ""),
          fontSize: 9,
          color: isDark ? "#e0e0e0" : "#333",
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };

  const onChartClick = (params: any) => {
    if (params.componentType === "series") {
      const country = countries[params.value[0]];
      
      // Toggle country filter on click
      toggleFilterValue("country", country);
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

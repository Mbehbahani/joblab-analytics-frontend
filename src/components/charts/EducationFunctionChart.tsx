"use client";

import ReactECharts from "echarts-for-react";
import { useFilterStore } from "@/store/filterStore";
import { getColor, commonChartOptions, getTooltipStyle, getTextColor, getAxisColor, getGridColor } from "./chartConfig";
import { Skeleton, useMantineColorScheme } from "@mantine/core";

type EducationData = {
  education_level: string;
  job_function_std: string;
  count: number;
};

type Props = {
  data: EducationData[] | undefined;
  loading?: boolean;
};

export function EducationFunctionChart({ data, loading }: Props) {
  const toggleFilterValue = useFilterStore((s) => s.toggleFilterValue);
  const selectedEducation = useFilterStore((s) => s.filters.education_level) || [];
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  if (loading || !data || data.length === 0) {
    return <Skeleton height={400} />;
  }

  // Get unique education levels and functions
  const educationLevels = [...new Set(data.map((d) => d.education_level))]
    .filter((e) => e && e !== "Not Specified")
    .sort();
  const functions = [...new Set(data.map((d) => d.job_function_std))];

  // Check for empty data after filtering
  if (educationLevels.length === 0 || functions.length === 0) {
    return <Skeleton height={400} />;
  }

  // Sort functions by total count
  const funcTotals = functions.map((f) => ({
    func: f,
    total: data.filter((d) => d.job_function_std === f).reduce((sum, d) => sum + d.count, 0),
  }));
  funcTotals.sort((a, b) => b.total - a.total);
  const sortedFunctions = funcTotals.slice(0, 10).map((f) => f.func); // Top 10 functions

  const series = educationLevels.slice(0, 6).map((edu) => {
    const isSelected = selectedEducation.length === 0 || selectedEducation.includes(edu);

    // Define colors for education levels
    const eduColors: Record<string, string> = {
      "PhD": "#5470c6",
      "Master": "#91cc75",
      "Bachelor": "#fac858",
      "Associate": "#ee6666",
      "High School": "#73c0de",
    };

    return {
      name: edu,
      type: "bar" as const,
      stack: "total",
      data: sortedFunctions.map((func) => {
        const item = data.find((d) => d.education_level === edu && d.job_function_std === func);
        return item?.count || 0;
      }),
      emphasis: {
        focus: "series" as const,
      },
      itemStyle: {
        color: eduColors[edu] || getColor("jobFunction", edu),
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
      data: sortedFunctions,
      axisLabel: {
        fontSize: 10,
        rotate: 30,
        interval: 0,
        width: 80,
        overflow: "truncate",
        color: getTextColor(isDark),
      },
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
      // Toggle education level filter
      toggleFilterValue("education_level", params.seriesName);
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

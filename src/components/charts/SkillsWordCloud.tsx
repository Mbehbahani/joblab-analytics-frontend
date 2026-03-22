"use client";

import { Skeleton, useMantineColorScheme } from "@mantine/core";
import ReactECharts from "echarts-for-react";
import { useFilterStore } from "@/store/filterStore";
import { getTooltipStyle, getTextColor, getAxisColor, getGridColor } from "./chartConfig";

type SkillData = {
  skill: string;
  count: number;
};

type Props = {
  data: SkillData[] | undefined;
  loading?: boolean;
};

export function SkillsWordCloud({ data, loading }: Props) {
  const toggleFilterValue = useFilterStore((s) => s.toggleFilterValue);
  const selectedSkills = useFilterStore((s) => s.filters.skills) || [];
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  if (loading || !data || data.length === 0) {
    return <Skeleton height={300} />;
  }

  // Take top 30 skills for better visualization
  const topSkills = data.slice(0, 30);
  
  // Check if we have skills after slicing
  if (topSkills.length === 0) {
    return <Skeleton height={300} />;
  }
  
  const maxCount = topSkills[0]?.count || 1;

  const option = {
    tooltip: {
      ...getTooltipStyle(isDark),
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
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
      data: topSkills.map(s => s.skill).reverse(),
      axisLabel: {
        fontSize: 10,
        width: 100,
        overflow: "truncate",
        color: getTextColor(isDark),
      },
      axisLine: { lineStyle: { color: getAxisColor(isDark) } },
    },
    series: [
      {
        name: "Jobs",
        type: "bar",
        data: topSkills.map(s => ({
          name: s.skill,
          value: s.count,
          itemStyle: {
            color: (() => {
              const ratio = s.count / maxCount;
              // Gradient from light blue to dark blue
              const r = Math.round(59 + (1 - ratio) * 100);
              const g = Math.round(130 + (1 - ratio) * 80);
              const b = Math.round(246 - (1 - ratio) * 50);
              return `rgb(${r}, ${g}, ${b})`;
            })(),
            opacity: selectedSkills.length === 0 || selectedSkills.includes(s.skill) ? 1 : 0.3,
            borderRadius: [0, 4, 4, 0],
          },
        })).reverse(),
        emphasis: {
          itemStyle: {
            color: "#228be6",
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
      toggleFilterValue("skills", params.name);
    }
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "100%", minHeight: 400 }}
      opts={{ renderer: "canvas" }}
      onEvents={{ click: onChartClick }}
      notMerge={true}
    />
  );
}

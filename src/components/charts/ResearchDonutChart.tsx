"use client";

import ReactECharts from "echarts-for-react";
import { useFilterStore } from "@/store/filterStore";
import { getColor, commonChartOptions, getTooltipStyle, getTextColor } from "./chartConfig";
import { Skeleton, useMantineColorScheme } from "@mantine/core";

type Props = {
  data: { type: string; count: number }[] | undefined;
  loading?: boolean;
};

export function ResearchDonutChart({ data, loading }: Props) {
  const setBooleanFilter = useFilterStore((s) => s.setBooleanFilter);
  const currentFilter = useFilterStore((s) => s.filters.is_research);
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  if (loading || !data || data.length === 0) {
    return <Skeleton height={300} circle />;
  }

  const chartData = data.map((d) => {
    const isResearch = d.type === "Research/Academic";
    const isSelected = 
      currentFilter === null || 
      (currentFilter === true && isResearch) || 
      (currentFilter === false && !isResearch);

    return {
      name: d.type,
      value: d.count,
      itemStyle: {
        color: getColor("research", d.type),
        opacity: isSelected ? 1 : 0.3,
      },
    };
  });

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  const option = {
    ...commonChartOptions,
    tooltip: {
      ...getTooltipStyle(isDark),
      trigger: "item",
      formatter: (params: any) => {
        const percentage = ((params.value / total) * 100).toFixed(1);
        return `<strong>${params.name}</strong><br/>Jobs: ${params.value} (${percentage}%)`;
      },
    },
    legend: {
      orient: "horizontal",
      bottom: 0,
      itemWidth: 14,
      itemHeight: 14,
      textStyle: { fontSize: 11, color: getTextColor(isDark) },
    },
    series: [
      {
        name: "Research vs Industry",
        type: "pie",
        radius: ["45%", "70%"],
        center: ["50%", "45%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: isDark ? "#1a1b1e" : "#fff",
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: "{b}\n{d}%",
          fontSize: 11,
          color: getTextColor(isDark),
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 10,
          lineStyle: {
            color: getTextColor(isDark),
          },
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: "bold",
          },
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0,0,0,0.3)",
          },
        },
        data: chartData,
      },
    ],
  };

  const onChartClick = (params: any) => {
    if (params.componentType === "series") {
      const isResearch = params.name === "Research/Academic";
      
      // Toggle: if already filtered to this value, clear the filter
      if ((currentFilter === true && isResearch) || (currentFilter === false && !isResearch)) {
        setBooleanFilter("is_research", null);
      } else {
        setBooleanFilter("is_research", isResearch);
      }
    }
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "300px", width: "100%" }}
      onEvents={{ click: onChartClick }}
      notMerge={true}
    />
  );
}

"use client";

import ReactECharts from "echarts-for-react";
import { useFilterStore } from "@/store/filterStore";
import { getColor, commonChartOptions, getTooltipStyle } from "./chartConfig";
import { Skeleton, useMantineColorScheme } from "@mantine/core";

type Props = {
  data: { company_industry_std: string; count: number }[] | undefined;
  loading?: boolean;
};

export function IndustryTreemap({ data, loading }: Props) {
  const toggleFilterValue = useFilterStore((s) => s.toggleFilterValue);
  const selectedIndustries = useFilterStore((s) => s.filters.company_industry_std) || [];
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  if (loading || !data || data.length === 0) {
    return <Skeleton height={350} />;
  }

  const treemapData = data.map((d) => ({
    name: d.company_industry_std,
    value: d.count,
    itemStyle: {
      color: getColor("industry", d.company_industry_std),
      opacity: selectedIndustries.length === 0 || selectedIndustries.includes(d.company_industry_std) ? 1 : 0.3,
    },
  }));

  const option = {
    ...commonChartOptions,
    tooltip: {
      ...getTooltipStyle(isDark),
      formatter: (params: any) => {
        return `<strong>${params.name}</strong><br/>Jobs: ${params.value}`;
      },
    },
    series: [
      {
        type: "treemap",
        data: treemapData,
        width: "95%",
        height: "95%",
        left: "2.5%",
        top: "2.5%",
        roam: false,
        nodeClick: "link",
        breadcrumb: {
          show: false,
        },
        label: {
          show: true,
          formatter: "{b}",
          fontSize: 11,
          color: "#fff",
          textShadowColor: "rgba(0,0,0,0.5)",
          textShadowBlur: 2,
        },
        itemStyle: {
          borderColor: isDark ? "#1a1b1e" : "#fff",
          borderWidth: 2,
          gapWidth: 2,
        },
        emphasis: {
          label: {
            fontSize: 14,
          },
          itemStyle: {
            shadowBlur: 20,
            shadowColor: "rgba(0,0,0,0.5)",
          },
        },
        levels: [
          {
            itemStyle: {
              borderWidth: 0,
              gapWidth: 4,
            },
          },
        ],
      },
    ],
  };

  const onChartClick = (params: any) => {
    if (params.componentType === "series" && params.name) {
      toggleFilterValue("company_industry_std", params.name);
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

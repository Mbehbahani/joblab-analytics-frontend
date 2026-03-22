"use client";

import ReactECharts from "echarts-for-react";
import { useFilterStore } from "@/store/filterStore";
import { commonChartOptions, tooltipStyle, CHART_COLORS } from "./chartConfig";
import { Skeleton } from "@mantine/core";
import { SunburstNode } from "@/types/dashboard";

type Props = {
  data: SunburstNode[] | undefined;
  loading?: boolean;
};

export function SunburstChart({ data, loading }: Props) {
  const toggleFilterValue = useFilterStore((s) => s.toggleFilterValue);

  if (loading || !data || data.length === 0) {
    return <Skeleton height={400} />;
  }

  // Limit data for readability - top industries
  const limitedData = data
    .map((industry) => {
      // Calculate industry total
      let total = 0;
      industry.children?.forEach((func) => {
        func.children?.forEach((level) => {
          total += level.value || 0;
        });
      });

      return {
        ...industry,
        total,
        // Limit functions per industry
        children: industry.children?.slice(0, 5).map((func) => ({
          ...func,
          // Limit levels per function
          children: func.children?.slice(0, 4),
        })),
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 8); // Top 8 industries

  const option = {
    ...commonChartOptions,
    tooltip: {
      ...tooltipStyle,
      trigger: "item",
      formatter: (params: any) => {
        const ancestors = params.treePathInfo || [];
        const path = ancestors.map((a: any) => a.name).join(" → ");
        return `<strong>${path}</strong><br/>Jobs: ${params.value || "N/A"}`;
      },
    },
    series: [
      {
        type: "sunburst",
        data: limitedData,
        radius: ["10%", "95%"],
        center: ["50%", "50%"],
        sort: "desc",
        emphasis: {
          focus: "ancestor",
        },
        levels: [
          {},
          {
            r0: "10%",
            r: "35%",
            itemStyle: {
              borderWidth: 2,
            },
            label: {
              rotate: "tangential",
              fontSize: 10,
              minAngle: 10,
            },
          },
          {
            r0: "35%",
            r: "65%",
            itemStyle: {
              borderWidth: 2,
            },
            label: {
              rotate: "tangential",
              fontSize: 9,
              minAngle: 15,
            },
          },
          {
            r0: "65%",
            r: "95%",
            label: {
              position: "outside",
              fontSize: 8,
              minAngle: 20,
              silent: false,
            },
            itemStyle: {
              borderWidth: 1,
            },
          },
        ],
        label: {
          color: "#333",
        },
        itemStyle: {
          borderRadius: 4,
          borderColor: "#fff",
        },
      },
    ],
    color: CHART_COLORS.primary,
  };

  const onChartClick = (params: any) => {
    if (params.componentType === "series" && params.treePathInfo) {
      const ancestors = params.treePathInfo;
      
      // If clicking on industry level (depth 1)
      if (ancestors.length === 2) {
        toggleFilterValue("company_industry_std", params.name);
      }
      // If clicking on function level (depth 2)
      else if (ancestors.length === 3) {
        toggleFilterValue("job_function_std", params.name);
      }
      // If clicking on level (depth 3)
      else if (ancestors.length === 4) {
        toggleFilterValue("job_level_std", params.name);
      }
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

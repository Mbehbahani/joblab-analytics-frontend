"use client";

import ReactECharts from "echarts-for-react";
import { useFilterStore } from "@/store/filterStore";
import { getColor, commonChartOptions, getTooltipStyle, getTextColor, getAxisColor, getGridColor } from "./chartConfig";
import { Skeleton, useMantineColorScheme } from "@mantine/core";

type Props = {
  data: { country: string; is_remote: string; count: number }[] | undefined;
  loading?: boolean;
};

export function CountryRemoteChart({ data, loading }: Props) {
  const toggleFilterValue = useFilterStore((s) => s.toggleFilterValue);
  const setBooleanFilter = useFilterStore((s) => s.setBooleanFilter);
  const remoteFilter = useFilterStore((s) => s.filters.is_remote);
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  if (loading || !data || data.length === 0) {
    return <Skeleton height={350} />;
  }

  // Get unique countries and remote statuses
  const countries = [...new Set(data.map((d) => d.country))];
  
  // Check for empty countries
  if (countries.length === 0) {
    return <Skeleton height={350} />;
  }
  const remoteStatuses = ["Remote", "On-site"];

  // Sort countries by total count
  const countryTotals = countries.map((c) => ({
    country: c,
    total: data.filter((d) => d.country === c).reduce((sum, d) => sum + d.count, 0),
  }));
  countryTotals.sort((a, b) => b.total - a.total);
  const sortedCountries = countryTotals.map((c) => c.country);

  const series = remoteStatuses.map((status) => {
    const isRemote = status === "Remote";
    const isSelected = remoteFilter === null || 
      (remoteFilter === true && isRemote) || 
      (remoteFilter === false && !isRemote);

    return {
      name: status,
      type: "bar" as const,
      stack: "total",
      data: sortedCountries.map((country) => {
        const item = data.find((d) => d.country === country && d.is_remote === status);
        return item?.count || 0;
      }),
      emphasis: {
        focus: "series" as const,
      },
      itemStyle: {
        color: getColor("remote", status),
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
        let total = 0;
        params.forEach((param: any) => {
          if (param.value > 0) {
            html += `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${param.color};margin-right:5px;"></span>${param.seriesName}: ${param.value}<br/>`;
            total += param.value;
          }
        });
        html += `<strong>Total: ${total}</strong>`;
        return html;
      },
    },
    legend: {
      data: remoteStatuses,
      bottom: 0,
      itemWidth: 14,
      itemHeight: 14,
      textStyle: { fontSize: 11, color: getTextColor(isDark) },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "12%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: sortedCountries,
      axisLabel: {
        fontSize: 10,
        rotate: 30,
        interval: 0,
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
      // Double-click behavior: toggle country
      toggleFilterValue("country", params.name);
    }
  };

  const onLegendClick = (params: any) => {
    const isRemote = params.name === "Remote";
    
    // Toggle: if already filtered to this value, clear the filter
    if ((remoteFilter === true && isRemote) || (remoteFilter === false && !isRemote)) {
      setBooleanFilter("is_remote", null);
    } else {
      setBooleanFilter("is_remote", isRemote);
    }
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: "350px", width: "100%" }}
      onEvents={{ 
        click: onChartClick,
        legendselectchanged: onLegendClick,
      }}
      notMerge={true}
    />
  );
}

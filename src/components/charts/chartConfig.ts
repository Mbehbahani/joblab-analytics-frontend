// Consistent color palette for all charts
export const CHART_COLORS = {
  primary: [
    "#5470c6",
    "#91cc75",
    "#fac858",
    "#ee6666",
    "#73c0de",
    "#3ba272",
    "#fc8452",
    "#9a60b4",
    "#ea7ccc",
    "#48b8d0",
  ],
  
  // Specific color mappings for dimensions
  jobType: {
    "Full-time": "#5470c6",
    "Contract": "#91cc75",
    "Internship": "#fac858",
    "Part-time": "#ee6666",
    "Other": "#73c0de",
  },
  
  jobLevel: {
    "Mid-Level": "#5470c6",
    "Entry Level": "#91cc75",
    "Internship": "#fac858",
    "Senior": "#ee6666",
    "Director": "#73c0de",
    "Associate": "#3ba272",
    "Executive": "#fc8452",
    "Not Specified": "#9a60b4",
  },
  
  jobFunction: {
    "Engineering": "#5470c6",
    "Data Science & Analytics": "#91cc75",
    "Supply Chain & Logistics": "#fac858",
    "Operations Research": "#ee6666",
    "Information Technology": "#73c0de",
    "Research & Development": "#3ba272",
    "Product Management": "#fc8452",
    "Business & Finance": "#9a60b4",
    "Consulting": "#ea7ccc",
    "Sales & Marketing": "#48b8d0",
    "Healthcare": "#6e7074",
    "Education": "#546570",
    "Management": "#c4ccd3",
    "Other": "#aaaaaa",
  },
  
  industry: {
    "Technology & Software": "#5470c6",
    "Manufacturing & Industrial": "#91cc75",
    "Energy & Utilities": "#fac858",
    "Finance & Banking": "#ee6666",
    "Consulting & Professional Services": "#73c0de",
    "Healthcare & Pharmaceuticals": "#3ba272",
    "Transportation & Logistics": "#fc8452",
    "Education & Research": "#9a60b4",
    "Retail & E-commerce": "#ea7ccc",
    "Aerospace & Defense": "#48b8d0",
    "Telecommunications": "#6e7074",
    "Government & Public Sector": "#546570",
    "Automotive": "#c4ccd3",
    "Food & Beverage": "#d48265",
    "Other": "#aaaaaa",
  },
  
  remote: {
    "Remote": "#5470c6",
    "On-site": "#91cc75",
  },
  
  research: {
    "Research/Academic": "#5470c6",
    "Industry/Corporate": "#91cc75",
  },
  
  searchTerm: {
    // Common search terms - unique colors
    "Operations Research": "#5470c6",
    "Supply Chain": "#91cc75",
    "Logistics": "#fac858",
    "Data Scientist": "#ee6666",
    "Data Analyst": "#73c0de",
    "Machine Learning": "#3ba272",
    "Business Analyst": "#fc8452",
    "Industrial Engineer": "#9a60b4",
    "Process Engineer": "#ea7ccc",
    "Optimization": "#48b8d0",
    "Analytics": "#6e7074",
    "Forecasting": "#546570",
    "Simulation": "#c4ccd3",
  },
};

// Get color for a specific dimension value
export function getColor(dimension: keyof typeof CHART_COLORS, value: string): string {
  const colorMap = CHART_COLORS[dimension] as Record<string, string>;
  if (colorMap && colorMap[value]) {
    return colorMap[value];
  }
  // Return a color from the primary palette based on hash
  const hash = value.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
  return CHART_COLORS.primary[Math.abs(hash) % CHART_COLORS.primary.length];
}

// Common chart options
export const commonChartOptions = {
  animation: true,
  animationDuration: 300,
  animationDurationUpdate: 300,
  animationEasing: "cubicOut" as const,
  animationEasingUpdate: "cubicOut" as const,
};

// Tooltip style for light mode
export const tooltipStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  borderColor: "#ccc",
  borderWidth: 1,
  textStyle: {
    color: "#333",
  },
  extraCssText: "box-shadow: 0 2px 10px rgba(0,0,0,0.1);",
};

// Tooltip style for dark mode
export const tooltipStyleDark = {
  backgroundColor: "rgba(30, 30, 30, 0.95)",
  borderColor: "#444",
  borderWidth: 1,
  textStyle: {
    color: "#e0e0e0",
  },
  extraCssText: "box-shadow: 0 2px 10px rgba(0,0,0,0.3);",
};

// Get tooltip style based on color scheme
export function getTooltipStyle(isDark: boolean) {
  return isDark ? tooltipStyleDark : tooltipStyle;
}

// Get text color for dark/light mode
export function getTextColor(isDark: boolean) {
  return isDark ? "#c1c2c5" : "#333";
}

// Get axis line color for dark/light mode
export function getAxisColor(isDark: boolean) {
  return isDark ? "#444" : "#ccc";
}

// Get grid line color for dark/light mode
export function getGridColor(isDark: boolean) {
  return isDark ? "#333" : "#eee";
}

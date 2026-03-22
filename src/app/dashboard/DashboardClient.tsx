"use client";

import { useDashboardData, useFilterOptions } from "@/lib/hooks";
import {
  Container,
  Stack,
  Title,
  Text,
  SimpleGrid,
  Paper,
  Divider,
  Accordion,
  Group,
} from "@mantine/core";
import {
  IconBriefcase,
  IconSchool,
  IconTimeline,
  IconWorld,
} from "@tabler/icons-react";
import { FilterBar } from "@/components/filters/FilterBar";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { JobsTable } from "@/components/dashboard/JobsTable";
import { JobFunctionBarChart } from "@/components/charts/JobFunctionBarChart";
import { IndustryTreemap } from "@/components/charts/IndustryTreemap";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { StackedJobTypeChart } from "@/components/charts/StackedJobTypeChart";
import { CountryMapChart } from "@/components/charts/CountryMapChart";
import { ResearchDonutChart } from "@/components/charts/ResearchDonutChart";
import { HeatmapChart } from "@/components/charts/HeatmapChart";
import { CountryRemoteChart } from "@/components/charts/CountryRemoteChart";
import { EducationFunctionChart } from "@/components/charts/EducationFunctionChart";
import { IndustryFunctionChart } from "@/components/charts/IndustryFunctionChart";
import { SkillsWordCloud } from "@/components/charts/SkillsWordCloud";
import { ToolsBarChart } from "@/components/charts/ToolsBarChart";
import { SearchTermChart } from "@/components/charts/SearchTermChart";
import { Header } from "@/components/layout/Header";
import { FirstVisitTour } from "@/components/onboarding/FirstVisitTour";
import { useAiPanelStore } from "@/store/aiPanelStore";
import { useKanbanUser } from "@/lib/useKanbanUser";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const headingId = `${toSlug(title)}-title`;

  return (
    <Paper component="article" aria-labelledby={headingId} p="md" withBorder h="100%">
      <Stack gap="sm" h="100%">
        <div>
          <Title id={headingId} order={3} size="h5">
            {title}
          </Title>
          {subtitle && <Text size="xs" c="dimmed">{subtitle}</Text>}
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          {children}
        </div>
      </Stack>
    </Paper>
  );
}

function SectionTitle({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description?: string;
}) {
  return (
    <header>
      <Title id={id} order={2} size="h3" mb={4}>
        {title}
      </Title>
      {description && <Text size="sm" c="dimmed" mb="md">{description}</Text>}
    </header>
  );
}

function CollapsibleSection({
  value,
  title,
  icon,
  children,
}: {
  value: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Accordion.Item value={value}>
      <Accordion.Control>
        <Group gap="sm" wrap="nowrap">
          {icon}
          <Text fw={600}>{title}</Text>
        </Group>
      </Accordion.Control>
      <Accordion.Panel>{children}</Accordion.Panel>
    </Accordion.Item>
  );
}

export function DashboardClient() {
  // Fetch filter options (cached, separate endpoint)
  const { filterOptions } = useFilterOptions();

  // Fetch all dashboard data in a single API call
  const {
    isLoading,
    kpis,
    countryData,
    jobFunctionData,
    industryData,
    skillsData,
    toolsData,
    searchTermData,
    timeSeriesData,
    heatmapData,
    stackedTypeLevel,
    stackedEduFunction,
    stackedCountryRemote,
    researchData,
    industryFunctionData,
    tableData,
  } = useDashboardData();

  const aiPanelOpen = useAiPanelStore((s) => s.open);
  const kanbanUserId = useKanbanUser();

  return (
    <main
      aria-label="JobLab analytics dashboard"
      className="dashboard-main"
      data-ai-open={aiPanelOpen || undefined}
    >
      <Container size="xl" py="lg">
        <Stack gap="lg">
          <FirstVisitTour />

          <Header />

          <FilterBar filterOptions={filterOptions} loading={isLoading} />

          <section aria-labelledby="overview-section-title">
            <SectionTitle id="overview-section-title" title="Overview" />
            <KpiCards data={kpis} loading={isLoading} />
          </section>

          <section aria-labelledby="skills-section-title">
            <SectionTitle id="skills-section-title" title="Skills & Search Analysis" />

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <ChartCard title="Jobs by Search Term">
                <SearchTermChart data={searchTermData} loading={!searchTermData} />
              </ChartCard>

              <ChartCard title="Jobs by Country">
                <CountryMapChart data={countryData} loading={!countryData} />
              </ChartCard>
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <ChartCard title="Tools">
                <ToolsBarChart data={toolsData} loading={!toolsData} /> 
              </ChartCard>

              <ChartCard title="Top Skills in Demand">
                <SkillsWordCloud data={skillsData} loading={!skillsData} />
              </ChartCard>
            </SimpleGrid>
          </section>

          <Divider my="md" />

          <Accordion
            id="dashboard-figure-panels"
            multiple
            variant="separated"
            radius="md"
            chevronPosition="left"
          >
            <CollapsibleSection
              value="industry-function"
              title="Industry & Function panel"
              icon={<IconBriefcase size={18} />}
            >
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" pt="xs">
                <ChartCard title="Industry Treemap">
                  <IndustryTreemap data={industryData} loading={!industryData} />
                </ChartCard>

                <ChartCard title="Job Functions">
                  <JobFunctionBarChart data={jobFunctionData} loading={!jobFunctionData} />
                </ChartCard>
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mt="md">
                <ChartCard title="Industry to Function Distribution">
                  <IndustryFunctionChart data={industryFunctionData} loading={!industryFunctionData} />
                </ChartCard>

                <ChartCard title="Job Type x Level Distribution">
                  <StackedJobTypeChart data={stackedTypeLevel} loading={!stackedTypeLevel} />
                </ChartCard>
              </SimpleGrid>
            </CollapsibleSection>

            <CollapsibleSection
              value="education-research"
              title="Education & Research panel"
              icon={<IconSchool size={18} />}
            >
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" pt="xs">
                <ChartCard title="Education Level x Job Function">
                  <EducationFunctionChart data={stackedEduFunction} loading={!stackedEduFunction} />
                </ChartCard>

                <ChartCard title="Research vs Industry">
                  <ResearchDonutChart data={researchData} loading={!researchData} />
                </ChartCard>
              </SimpleGrid>
            </CollapsibleSection>

            <CollapsibleSection
              value="geo-remote"
              title="Geographic & Remote Work panel"
              icon={<IconWorld size={18} />}
            >
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" pt="xs">
                <ChartCard title="Country x Remote Status">
                  <CountryRemoteChart data={stackedCountryRemote} loading={!stackedCountryRemote} />
                </ChartCard>

                <ChartCard title="Country x Function Heatmap">
                  <HeatmapChart data={heatmapData} loading={!heatmapData} />
                </ChartCard>
              </SimpleGrid>
            </CollapsibleSection>

            <CollapsibleSection
              value="temporal-analysis"
              title="Temporal Analysis panel"
              icon={<IconTimeline size={18} />}
            >
              <div style={{ paddingTop: "0.25rem" }}>
                <ChartCard title="Jobs Over Time">
                  <TimeSeriesChart data={timeSeriesData} loading={!timeSeriesData} />
                </ChartCard>
              </div>
            </CollapsibleSection>
          </Accordion>

          <Divider my="md" />

          <section aria-labelledby="details-section-title">
            <SectionTitle id="details-section-title" title="Job Details" />

            <JobsTable data={tableData} loading={!tableData} kanbanUserId={kanbanUserId} />
          </section>
        </Stack>
      </Container>
    </main>
  );
}

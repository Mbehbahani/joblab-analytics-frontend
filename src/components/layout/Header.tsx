"use client";

import { useState } from "react";
import {
  Group,
  Title,
  Text,
  ActionIcon,
  useMantineColorScheme,
  useComputedColorScheme,
  Box,
  Tooltip,
  Anchor,
  Popover,
  Stack,
} from "@mantine/core";
import {
  IconSun,
  IconMoon,
  IconSparkles,
  IconSearch,
  IconFileText,
  IconInfoCircle,
  IconLayoutKanban,
} from "@tabler/icons-react";
import Image from "next/image";
import { useMounted } from "@mantine/hooks";
import { AiPanel } from "@/components/ai/AiPanel";
import { AiInsightPanel } from "@/components/ai/AiInsightPanel";
import { JobLookupPanel } from "@/components/dashboard/JobLookupPanel";
import { CVMatcher } from "@/components/ai/CVMatcher";
import { useAiPanelStore } from "@/store/aiPanelStore";

export function Header() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light");
  const mounted = useMounted();
  const { open: aiOpen, setOpen: setAiOpen } = useAiPanelStore();
  const [lookupOpen, setLookupOpen] = useState(false);
  const [cvMatchOpen, setCvMatchOpen] = useState(false);

  // Use a stable default for SSR to prevent hydration mismatch
  const isDark = mounted ? computedColorScheme === "dark" : false;

  return (
    <>
      <Box
        component="header"
        py="md"
        mb="lg"
        style={{
          borderBottom: "1px solid var(--mantine-color-default-border)",
        }}
      >
        <Group justify="space-between" align="center">
          {/* Brand */}
          <Group gap="md" align="center">
            <Anchor href="https://www.oploy.eu/blog/oploy-jobs/" target="_blank" rel="noopener noreferrer">
              <Image
                src={isDark ? "/icon-dark.svg" : "/icon-light.svg"}
                alt="JobLab Logo"
                width={56}
                height={56}
                priority
              />
            </Anchor>
            <Box>
              <Title order={1} size="h3">
                JobLab Analytics
              </Title>
              <Group gap={6} align="center">
                <Text size="xs" c="dimmed">
                  Operations Research Jobs (LinkedIn/Indeed)
                </Text>
                <Popover width={320} position="bottom-start" withArrow shadow="md">
                  <Popover.Target>
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      color="gray"
                      aria-label="About this project"
                    >
                      <IconInfoCircle size={15} />
                    </ActionIcon>
                  </Popover.Target>
                  <Popover.Dropdown p="md">
                    <Stack gap={8}>
                      <Text fw={600} size="sm">
                        About this project
                      </Text>
                      <Text size="sm" c="dimmed">
                        This dashboard helps you explore jobs related to system optimization and
                        operations research.
                      </Text>
                      <Text size="sm" c="dimmed">
                        The data is scraped every day. Indeed covers the selected countries, while
                        LinkedIn is currently limited to the USA, Germany, and the Netherlands.
                      </Text>
                      <Text size="sm" c="dimmed">
                        The infrastructure can be adapted to other job fields, but this pilot is
                        still under development and currently focused on this specific domain.
                      </Text>
                    </Stack>
                  </Popover.Dropdown>
                </Popover>
              </Group>
            </Box>
          </Group>

          {/* Actions */}
          <Group gap="xs">

            {/* Theme Toggle */}
            <Tooltip label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <ActionIcon
                onClick={() => setColorScheme(isDark ? "light" : "dark")}
                variant="default"
                size="lg"
                aria-label="Toggle color scheme"
              >
                {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
              </ActionIcon>
            </Tooltip>

            {/* Job Lookup Button */}
            <Tooltip label="Job Lookup" position="bottom">
              <ActionIcon
                onClick={() => setLookupOpen(true)}
                variant="light"
                color="teal"
                size="lg"
                aria-label="Open Job Lookup"
              >
                <IconSearch size={20} />
              </ActionIcon>
            </Tooltip>
            {/* AI CV Match Button */}
            <Tooltip label="AI CV Match" position="bottom">
              <button
                id="cv-match-trigger"
                onClick={() => setCvMatchOpen(true)}
                aria-label="Open AI CV Match"
                className="cv-match-btn"
              >
                <IconFileText size={18} />
                <span>CV Match</span>
              </button>
            </Tooltip>

            {/* Agent Button */}
            <Tooltip label={aiOpen ? "Close Agent" : "AI Agent"} position="bottom">
              <button
                onClick={() => setAiOpen(!aiOpen)}
                aria-label={aiOpen ? "Close AI Agent" : "Open AI Agent"}
                className={`agent-btn${aiOpen ? " agent-btn--active" : ""}`}
              >
                <IconSparkles size={18} />
                <span>Agent</span>
              </button>
            </Tooltip>

            {/* Jobflow Link */}
            <Tooltip label="Open Jobflow" position="bottom">
              <a
                href={process.env.NEXT_PUBLIC_KANBAN_URL || "http://localhost:5173"}
                target="_blank"
                rel="noopener noreferrer"
                className="kanban-btn"
                aria-label="Open Jobflow"
              >
                <IconLayoutKanban size={18} />
                <span>Jobflow</span>
              </a>
            </Tooltip>

          </Group>
        </Group>
      </Box>

      {/* AI Panel */}
      <AiPanel opened={aiOpen} onClose={() => setAiOpen(false)} />

      {/* Job Lookup Panel (Drawer) */}
      <JobLookupPanel opened={lookupOpen} onClose={() => setLookupOpen(false)} />

      {/* AI CV Match Panel (Drawer) */}
      <CVMatcher opened={cvMatchOpen} onClose={() => setCvMatchOpen(false)} />

      {/* AI Insight Chart Panel (Left Drawer) */}
      <AiInsightPanel />
    </>
  );
}

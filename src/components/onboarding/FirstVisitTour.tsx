"use client";

import { useEffect, useState } from "react";
import { Button, Group, Paper, Portal, Text, ThemeIcon } from "@mantine/core";
import { IconCompass, IconX } from "@tabler/icons-react";

const TOUR_STORAGE_KEY = "joblab:first-visit-tour-dismissed";

type TourStep = {
  id: string;
  title: string;
  body: string;
  targetId: string;
};

const TOUR_STEPS: TourStep[] = [
  {
    id: "filters",
    title: "Start with filters",
    body: "Open Filters to narrow jobs by country, date, remote work, sector, skills, and platform.",
    targetId: "dashboard-filter-bar",
  },
  {
    id: "figures",
    title: "Open chart panels when needed",
    body: "These figure sections are collapsed to save space. Open any panel to explore industry, education, geography, and time trends.",
    targetId: "dashboard-figure-panels",
  },
  {
    id: "cv-match",
    title: "Match a CV quickly",
    body: "Use CV Match to upload a CV and get ranked job matches with full details from your database.",
    targetId: "cv-match-trigger",
  },
];

export function FirstVisitTour() {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    let timer: number | null = null;

    try {
      const dismissed = window.localStorage.getItem(TOUR_STORAGE_KEY);
      if (!dismissed) {
        timer = window.setTimeout(() => setOpen(true), 0);
      }
    } catch {
      timer = window.setTimeout(() => setOpen(true), 0);
    }

    return () => {
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const target = document.getElementById(TOUR_STEPS[stepIndex]?.targetId);
    if (!target) {
      return;
    }

    target.setAttribute("data-tour-active", "true");
    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

    return () => {
      target.removeAttribute("data-tour-active");
    };
  }, [open, stepIndex]);

  const closeTour = () => {
    try {
      window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
    } catch {}
    setOpen(false);
  };

  if (!open) {
    return null;
  }

  const step = TOUR_STEPS[stepIndex];
  const isLastStep = stepIndex === TOUR_STEPS.length - 1;

  return (
    <Portal>
      <Paper className="first-visit-tour" withBorder radius="lg" p="md">
        <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
          <Group gap="sm" align="flex-start" wrap="nowrap">
            <ThemeIcon color="blue" variant="light" radius="xl" size="lg">
              <IconCompass size={18} />
            </ThemeIcon>
            <div>
              <Text size="xs" tt="uppercase" fw={700} c="blue">
                Quick guide
              </Text>
              <Text fw={600}>{step.title}</Text>
              <Text size="sm" c="dimmed" mt={4}>
                {step.body}
              </Text>
              <Text size="xs" c="dimmed" mt={8}>
                {stepIndex + 1} / {TOUR_STEPS.length}
              </Text>
            </div>
          </Group>

          <Button
            variant="subtle"
            color="gray"
            size="compact-sm"
            px={6}
            onClick={closeTour}
            aria-label="Close quick guide"
          >
            <IconX size={16} />
          </Button>
        </Group>

        <Group justify="space-between" mt="md">
          <Button variant="subtle" color="gray" size="xs" onClick={closeTour}>
            Skip
          </Button>
          <Group gap="xs">
            {stepIndex > 0 && (
              <Button
                variant="default"
                size="xs"
                onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
              >
                Back
              </Button>
            )}
            <Button
              size="xs"
              onClick={() => {
                if (isLastStep) {
                  closeTour();
                  return;
                }
                setStepIndex((current) => Math.min(TOUR_STEPS.length - 1, current + 1));
              }}
            >
              {isLastStep ? "Done" : "Next"}
            </Button>
          </Group>
        </Group>
      </Paper>
    </Portal>
  );
}

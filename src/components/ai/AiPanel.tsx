"use client";

import { useState, useEffect, useRef } from "react";
import {
  Stack,
  Text,
  Textarea,
  Group,
  Paper,
  Alert,
  Badge,
  ScrollArea,
  ActionIcon,
  Tooltip,
  Box,
  useMantineColorScheme,
  Transition,
} from "@mantine/core";
import {
  IconSparkles,
  IconSend2,
  IconAlertCircle,
  IconTrash,
  IconRobot,
  IconUser,
  IconChartBar,
  IconAtom,
  IconSearch,
  IconMessageCircleQuestion,
  IconBan,
  IconRouteAltLeft,
  IconAlertTriangle,
  IconThumbUp,
  IconThumbDown,
  IconThumbUpFilled,
  IconThumbDownFilled,
  IconX,
  IconBriefcase,
  IconTrendingUp,
  IconWorld,
  IconBrain,
  IconMapPin,
  IconCalendar,
} from "@tabler/icons-react";
import { useAiSearch } from "@/lib/useAiSearch";
import type { AiMessage } from "@/lib/useAiSearch";
import { useAiInsightStore } from "@/store/aiInsightStore";
import { AiJobResults } from "@/components/ai/AiJobResults";
import { JobDetailsModal } from "@/components/jobs/JobDetailsModal";
import ReactMarkdown from "react-markdown";

const EXAMPLE_PROMPTS = [
  {
    icon: IconTrendingUp,
    prompt: "How many jobs in the Netherlands posted in February 2026?",
    color: "blue",
  },
  {
    icon: IconBriefcase,
    prompt: "Show remote research jobs in Germany from January 2026",
    color: "teal",
  },
  {
    icon: IconBrain,
    prompt: "Find jobs related to stochastic optimization",
    color: "violet",
  },
  {
    icon: IconMapPin,
    prompt: "Count jobs by European country posted after 2026-01-01",
    color: "orange",
  },
  {
    icon: IconWorld,
    prompt: "Find senior data science roles in France",
    color: "cyan",
  },
  {
    icon: IconCalendar,
    prompt: "Show positions about container shipping forecasting",
    color: "grape",
  },
];

interface AiPanelProps {
  opened: boolean;
  onClose: () => void;
}

type ProgressStep = {
  label: string;
  done: boolean;
  active: boolean;
};

const AI_STEP_LABELS = [
  "Understanding your request...",
  "Choosing the right search mode...",
  "Querying the job database...",
  "Preparing the final answer...",
];

function renderModeBadge(mode: AiMessage["mode"]) {
  switch (mode) {
    case "semantic_search":
      return (
        <Badge
          size="xs"
          variant="light"
          color="violet"
          leftSection={<IconAtom size={15} />}
        >
          Semantic search mode
        </Badge>
      );
    case "job_stats":
      return (
        <Badge
          size="xs"
          variant="light"
          color="blue"
          leftSection={<IconChartBar size={15} />}
        >
          Job stats mode
        </Badge>
      );
    case "job_search":
      return (
        <Badge
          size="xs"
          variant="light"
          color="teal"
          leftSection={<IconSearch size={15} />}
        >
          Job search mode
        </Badge>
      );
    case "clarification":
      return (
        <Badge
          size="xs"
          variant="light"
          color="yellow"
          leftSection={<IconMessageCircleQuestion size={15} />}
        >
          Clarification needed
        </Badge>
      );
    case "decline":
      return (
        <Badge
          size="xs"
          variant="light"
          color="gray"
          leftSection={<IconBan size={15} />}
        >
          Out of scope
        </Badge>
      );
    case "handoff":
      return (
        <Badge
          size="xs"
          variant="light"
          color="orange"
          leftSection={<IconRouteAltLeft size={15} />}
        >
          Handoff mode
        </Badge>
      );
    case "error":
      return (
        <Badge
          size="xs"
          variant="light"
          color="red"
          leftSection={<IconAlertTriangle size={15} />}
        >
          Error state
        </Badge>
      );
    default:
      return null;
  }
}

function getAssistantDisplayContent(message: AiMessage): string {
  if (!message.jobResults?.length) {
    return message.content;
  }

  const count = message.jobResults.length;
  return `Showing ${count} matching job${count !== 1 ? "s" : ""} in structured cards below.`;
}

export function AiPanel({ opened, onClose }: AiPanelProps) {
  const [input, setInput] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const { messages, loading, error, search, reset, sendFeedback } = useAiSearch();
  const { colorScheme } = useMantineColorScheme();
  const { showChart } = useAiInsightStore();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const progressTimerRef = useRef<number[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeStep = steps.find((step) => step.active) ?? steps[steps.length - 1] ?? null;
  const isDark = colorScheme === "dark";

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector(".mantine-ScrollArea-viewport");
    if (viewport && messages.length > 0) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (loading) return;
    progressTimerRef.current.forEach((timer) => window.clearTimeout(timer));
    progressTimerRef.current = [];
  }, [loading]);

  useEffect(() => {
    return () => {
      progressTimerRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  // Focus textarea when panel opens
  useEffect(() => {
    if (opened) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [opened]);

  const startProgress = () => {
    progressTimerRef.current.forEach((timer) => window.clearTimeout(timer));
    progressTimerRef.current = [];

    const initial = AI_STEP_LABELS.map((label, i) => ({
      label,
      done: false,
      active: i === 0,
    }));
    setSteps(initial);

    const delays = [700, 1200, 1700];
    delays.forEach((delay, stepIndex) => {
      const totalDelay = delays.slice(0, stepIndex + 1).reduce((sum, v) => sum + v, 0);
      const timer = window.setTimeout(() => {
        setSteps((prev) =>
          prev.map((step, i) => ({
            ...step,
            done: i <= stepIndex,
            active: i === stepIndex + 1,
          }))
        );
      }, totalDelay);
      progressTimerRef.current.push(timer);
    });
  };

  const handleSubmit = () => {
    const q = input.trim();
    if (!q || loading) return;
    startProgress();
    search(q);
    setInput("");
  };

  const handlePromptClick = (prompt: string) => {
    if (loading) return;
    startProgress();
    search(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <JobDetailsModal
        opened={!!selectedJobId}
        onClose={() => setSelectedJobId(null)}
        jobId={selectedJobId}
      />

      {/* Floating Chat Panel */}
      <Transition mounted={opened} transition="slide-left" duration={300} timingFunction="ease">
        {(styles) => (
          <Box
            className="ai-chat-panel"
            style={{
              ...styles,
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(480px, 100vw)",
              zIndex: 300,
              display: "flex",
              flexDirection: "column",
              backgroundColor: isDark ? "#1a1b1e" : "#ffffff",
              borderLeft: `1px solid ${isDark ? "#373a40" : "#e9ecef"}`,
              boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
            }}
          >
            {/* ── Header ─────────────────────────── */}
            <Box
              className="ai-chat-header"
              style={{
                padding: "16px 20px",
                borderBottom: `1px solid ${isDark ? "#373a40" : "#e9ecef"}`,
                backgroundColor: isDark ? "#25262b" : "#ffffff",
                flexShrink: 0,
              }}
            >
              <Group justify="space-between" align="center">
                <Group gap="sm">
                  <Box
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #228be6 0%, #7950f2 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(34,139,230,0.3)",
                    }}
                  >
                    <IconSparkles size={20} color="#fff" />
                  </Box>
                  <Box>
                    <Text fw={600} size="md" lh={1.2}>
                      Agent
                    </Text>
                    <Text size="xs" c="dimmed" lh={1.2}>
                      AI-powered job assistant
                    </Text>
                  </Box>
                </Group>
                <Group gap={4}>
                  {messages.length > 0 && (
                    <Tooltip label="Clear conversation">
                      <ActionIcon variant="subtle" size="sm" color="gray" onClick={() => { setInput(""); reset(); }}>
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                  <Tooltip label="Close">
                    <ActionIcon variant="subtle" size="sm" color="gray" onClick={onClose}>
                      <IconX size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Box>

            {/* ── Conversation Area ──────────────── */}
            <ScrollArea
              ref={scrollAreaRef}
              style={{ flex: 1, minHeight: 0 }}
              offsetScrollbars
              scrollbarSize={6}
            >
              <Box style={{ padding: "16px 20px" }}>
                {/* Empty State */}
                {messages.length === 0 && !loading && (
                  <Stack gap="lg" align="center" style={{ paddingTop: 40 }}>
                    <Box
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 16,
                        background: isDark
                          ? "linear-gradient(135deg, rgba(34,139,230,0.15) 0%, rgba(121,80,242,0.15) 100%)"
                          : "linear-gradient(135deg, rgba(34,139,230,0.08) 0%, rgba(121,80,242,0.08) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconSparkles size={32} style={{ color: "var(--mantine-color-blue-5)" }} />
                    </Box>
                    <Stack gap={4} align="center">
                      <Text fw={600} size="lg">
                        How can I help you?
                      </Text>
                    </Stack>

                    {/* Example Prompt Chips */}
                    <Box
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: 6,
                        width: "100%",
                        marginTop: 8,
                      }}
                    >
                      {EXAMPLE_PROMPTS.map((ex, i) => {
                        const Icon = ex.icon;
                        return (
                          <Paper
                            key={i}
                            className="ai-sample-chip"
                            p="sm"
                            radius="md"
                            style={{
                              cursor: loading ? "not-allowed" : "pointer",
                              opacity: loading ? 0.5 : 1,
                              border: `1px solid ${isDark ? "#373a40" : "#e9ecef"}`,
                              backgroundColor: isDark ? "#25262b" : "#f8f9fa",
                            }}
                            onClick={() => handlePromptClick(ex.prompt)}
                          >
                            <Group gap={8} wrap="nowrap" align="center">
                              <Icon
                                size={15}
                                style={{
                                  color: `var(--mantine-color-${ex.color}-5)`,
                                  flexShrink: 0,
                                }}
                              />
                              <Text size="xs" c={isDark ? "gray.3" : "dark.6"} lh={1.35} lineClamp={2} style={{ fontSize: 11 }}>
                                {ex.prompt}
                              </Text>
                            </Group>
                          </Paper>
                        );
                      })}
                    </Box>
                  </Stack>
                )}

                {/* Messages */}
                {messages.length > 0 && (
                  <Stack gap="md">
                    {messages.map((msg, idx) => {
                      const isUser = msg.role === "user";
                      const assistantDisplayContent =
                        msg.role === "assistant" ? getAssistantDisplayContent(msg) : msg.content;
                      const hasStructuredJobResults =
                        msg.role === "assistant" && !!msg.jobResults && msg.jobResults.length > 0;

                      return (
                        <Box
                          key={idx}
                          className="ai-message-bubble"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: isUser ? "flex-end" : "flex-start",
                          }}
                        >
                          {/* Avatar + Name */}
                          <Group gap={6} mb={4} style={{ flexDirection: isUser ? "row-reverse" : "row" }}>
                            <Box
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: isUser
                                  ? "var(--mantine-color-blue-5)"
                                  : isDark ? "#2c2e33" : "#f1f3f5",
                              }}
                            >
                              {isUser ? (
                                <IconUser size={14} color="#fff" />
                              ) : (
                                <IconRobot size={14} style={{ color: "var(--mantine-color-grape-5)" }} />
                              )}
                            </Box>
                            <Text size="xs" fw={500} c="dimmed">
                              {isUser ? "You" : "Agent"}
                            </Text>
                          </Group>

                          {/* Message Bubble */}
                          <Paper
                            p="sm"
                            radius="lg"
                            style={{
                              maxWidth: "88%",
                              backgroundColor: isUser
                                ? "var(--mantine-color-blue-6)"
                                : isDark ? "#25262b" : "#f1f3f5",
                              border: isUser
                                ? "none"
                                : `1px solid ${isDark ? "#373a40" : "#e9ecef"}`,
                              borderTopRightRadius: isUser ? 4 : undefined,
                              borderTopLeftRadius: isUser ? undefined : 4,
                            }}
                          >
                            <Stack gap="xs">
                              {/* Content */}
                              {isUser ? (
                                <Text
                                  size="sm"
                                  style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
                                  c="white"
                                >
                                  {msg.content}
                                </Text>
                              ) : hasStructuredJobResults ? (
                                <Text
                                  size="sm"
                                  style={{ lineHeight: 1.6 }}
                                  c={isDark ? "gray.2" : "dark.9"}
                                >
                                  {assistantDisplayContent}
                                </Text>
                              ) : (
                                <Box
                                  className="ai-markdown"
                                  style={{ lineHeight: 1.6, fontSize: "var(--mantine-font-size-sm)" }}
                                  c={isDark ? "gray.2" : "dark.9"}
                                >
                                  <ReactMarkdown
                                    components={{
                                      a: ({ href, children }) => (
                                        <a href={href} target="_blank" rel="noopener noreferrer"
                                          style={{ color: "var(--mantine-color-blue-5)" }}>
                                          {children}
                                        </a>
                                      ),
                                      p: ({ children }) => <p style={{ margin: "0.25em 0" }}>{children}</p>,
                                      ol: ({ children }) => <ol style={{ paddingLeft: "1.4em", margin: "0.25em 0" }}>{children}</ol>,
                                      ul: ({ children }) => <ul style={{ paddingLeft: "1.4em", margin: "0.25em 0" }}>{children}</ul>,
                                      li: ({ children }) => <li style={{ marginBottom: "0.3em" }}>{children}</li>,
                                    }}
                                  >
                                    {assistantDisplayContent}
                                  </ReactMarkdown>
                                </Box>
                              )}

                              {/* Chart action */}
                              {!isUser && msg.recommendation && !msg.semantic && (
                                <Group gap={4}>
                                  <Tooltip label="View chart">
                                    <ActionIcon variant="subtle" size="sm" color="teal" onClick={() => showChart(msg.recommendation!)}>
                                      <IconChartBar size={16} />
                                    </ActionIcon>
                                  </Tooltip>
                                </Group>
                              )}

                              {/* Mode badge */}
                              {!isUser && renderModeBadge(msg.mode)}

                              {/* Structured job results */}
                              {!isUser && msg.jobResults && msg.jobResults.length > 0 && (
                                <AiJobResults
                                  jobs={msg.jobResults}
                                  onViewDetails={(jobId) => setSelectedJobId(jobId)}
                                />
                              )}

                              {/* Feedback */}
                              {!isUser && (msg.traceId || (msg.conversationId && msg.turnId)) && (
                                <Group gap={4} mt={2}>
                                  <Tooltip label={msg.feedbackGiven === "up" ? "Thanks!" : "Helpful"}>
                                    <ActionIcon
                                      variant="subtle"
                                      size="xs"
                                      color={msg.feedbackGiven === "up" ? "teal" : "gray"}
                                      onClick={() => sendFeedback(idx, true)}
                                      disabled={msg.feedbackGiven !== undefined && msg.feedbackGiven !== null}
                                    >
                                      {msg.feedbackGiven === "up" ? <IconThumbUpFilled size={28} /> : <IconThumbUp size={28} />}
                                    </ActionIcon>
                                  </Tooltip>
                                  <Tooltip label={msg.feedbackGiven === "down" ? "Thanks!" : "Not helpful"}>
                                    <ActionIcon
                                      variant="subtle"
                                      size="xs"
                                      color={msg.feedbackGiven === "down" ? "red" : "gray"}
                                      onClick={() => sendFeedback(idx, false)}
                                      disabled={msg.feedbackGiven !== undefined && msg.feedbackGiven !== null}
                                    >
                                      {msg.feedbackGiven === "down" ? <IconThumbDownFilled size={28} /> : <IconThumbDown size={28} />}
                                    </ActionIcon>
                                  </Tooltip>
                                </Group>
                              )}
                            </Stack>
                          </Paper>
                        </Box>
                      );
                    })}

                    {/* Typing indicator */}
                    {loading && (
                      <Box style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <Group gap={6} mb={4}>
                          <Box
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 8,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: isDark ? "#2c2e33" : "#f1f3f5",
                            }}
                          >
                            <IconRobot size={14} style={{ color: "var(--mantine-color-grape-5)" }} />
                          </Box>
                          <Text size="xs" fw={500} c="dimmed">Agent</Text>
                        </Group>
                        <Paper
                          p="sm"
                          radius="lg"
                          style={{
                            backgroundColor: isDark ? "#25262b" : "#f1f3f5",
                            border: `1px solid ${isDark ? "#373a40" : "#e9ecef"}`,
                            borderTopLeftRadius: 4,
                            maxWidth: "88%",
                          }}
                        >
                          <Stack gap={6}>
                            {activeStep && (
                              <Group gap="sm" wrap="nowrap" align="center">
                                <Box className="ai-typing-dots">
                                  <span /><span /><span />
                                </Box>
                                <Text size="xs" fw={500} c="dimmed" style={{ letterSpacing: "0.01em" }}>
                                  {activeStep.label}
                                </Text>
                              </Group>
                            )}
                          </Stack>
                        </Paper>
                      </Box>
                    )}
                  </Stack>
                )}
              </Box>
            </ScrollArea>

            {/* ── Error ──────────────────────────── */}
            {error && (
              <Box style={{ padding: "0 20px" }}>
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  title="Something went wrong"
                  color="red"
                  variant="light"
                  withCloseButton
                  onClose={() => reset()}
                  radius="md"
                >
                  {error}
                </Alert>
              </Box>
            )}

            {/* ── Input Area (Fixed Bottom) ──────── */}
            <Box
              className="ai-chat-input-area"
              style={{
                padding: "12px 20px 16px",
                borderTop: `1px solid ${isDark ? "#373a40" : "#e9ecef"}`,
                backgroundColor: isDark ? "#25262b" : "#ffffff",
                flexShrink: 0,
              }}
            >
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <Box
                  style={{
                    position: "relative",
                    borderRadius: 16,
                    border: `1.5px solid ${isDark ? "#4a4b50" : "#dee2e6"}`,
                    backgroundColor: isDark ? "#1a1b1e" : "#f8f9fa",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  }}
                  className="ai-input-wrapper"
                >
                  <Textarea
                    ref={textareaRef}
                    placeholder="Ask the Agent anything…"
                    value={input}
                    onChange={(e) => setInput(e.currentTarget.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    autosize
                    minRows={1}
                    maxRows={4}
                    styles={{
                      input: {
                        border: "none",
                        background: "transparent",
                        paddingRight: 48,
                        paddingTop: 10,
                        paddingBottom: 10,
                        paddingLeft: 16,
                        fontSize: "var(--mantine-font-size-sm)",
                        resize: "none",
                      },
                    }}
                  />
                  <ActionIcon
                    variant="filled"
                    color="blue"
                    size={32}
                    radius="xl"
                    onClick={handleSubmit}
                    disabled={!input.trim() || loading}
                    style={{
                      position: "absolute",
                      right: 8,
                      bottom: 6,
                      transition: "transform 0.15s ease, opacity 0.15s ease",
                      opacity: input.trim() ? 1 : 0.4,
                    }}
                  >
                    <IconSend2 size={16} />
                  </ActionIcon>
                </Box>
              </form>
              <Text size="xs" c="dimmed" ta="center" mt={6}>
                Agent can make mistakes. Verify important information.
              </Text>
            </Box>
          </Box>
        )}
      </Transition>
    </>
  );
}

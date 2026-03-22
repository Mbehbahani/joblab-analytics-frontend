"use client";

import { useState, useCallback, useRef } from "react";
import {
  Stack,
  Text,
  Textarea,
  Group,
  Paper,
  Loader,
  Alert,
  Badge,
  ScrollArea,
  Button,
  Box,
  ThemeIcon,
  Tooltip,
  ActionIcon,
  Divider,
  FileButton,
  useMantineColorScheme,
  MultiSelect,
  TextInput,
  Collapse,
  Transition,
} from "@mantine/core";
import {
  IconFileText,
  IconAlertCircle,
  IconCheck,
  IconSparkles,
  IconUpload,
  IconExternalLink,
  IconEye,
  IconMapPin,
  IconBuilding,
  IconX,
  IconTrophy,
  IconMedal,
  IconFilter,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import { useFilterOptions } from "@/lib/hooks";
import { JobDetailsModal } from "@/components/jobs/JobDetailsModal";

// ── Types ──────────────────────────────────────────────────────────────────

interface JobMatchResult {
  job_id: string;
  title: string;
  company: string;
  similarity: number;
  country?: string;
  location?: string;
  url?: string;
  posted_date?: string;
  job_level_std?: string;
  job_function_std?: string;
  job_type_filled?: string;
  platform?: string;
  is_remote?: boolean;
  relaxed_criteria?: boolean;
}

interface CVMatchResponse {
  cv_id: string;
  matches: JobMatchResult[];
}

type ProgressStep = {
  label: string;
  done: boolean;
  active: boolean;
};

// ── Helpers ────────────────────────────────────────────────────────────────

const STEP_LABELS = [
  "Analyzing CV...",
  "Generating embedding...",
  "Matching against jobs (applying filters)...",
  "Finalizing results...",
];

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const LEVEL_COLORS: Record<string, string> = {
  Junior: "green",
  "Entry Level": "green",
  "Mid-Level": "blue",
  Mid: "blue",
  Senior: "orange",
  Lead: "red",
  Manager: "pink",
  Director: "grape",
  Executive: "violet",
};

/**
 * Rescale raw cosine similarity to a human-friendly relevance score.
 * Raw values typically cluster in 0.45–0.65 range. This maps
 * the top match to ~95–98% and spaces the rest proportionally.
 */
function computeRelevanceScores(
  matches: JobMatchResult[]
): { score: number; rank: number }[] {
  if (matches.length === 0) return [];

  const sims = matches.map((m) => m.similarity);
  const maxSim = Math.max(...sims);
  const minSim = Math.min(...sims);
  const range = maxSim - minSim || 0.01; // avoid division by zero

  return matches.map((m, i) => {
    // Normalize to 0–1 within the result set, then map to 70–98 range
    const normalized = (m.similarity - minSim) / range;
    const score = Math.round(70 + normalized * 28); // 70% to 98%
    return { score, rank: i + 1 };
  });
}

function getRankIcon(rank: number) {
  if (rank === 1) return <IconTrophy size={16} style={{ color: "#FFD700" }} />;
  if (rank === 2) return <IconMedal size={16} style={{ color: "#C0C0C0" }} />;
  if (rank === 3) return <IconMedal size={16} style={{ color: "#CD7F32" }} />;
  return null;
}

function getRankColor(score: number): string {
  if (score >= 90) return "green";
  if (score >= 80) return "teal";
  if (score >= 75) return "blue";
  return "yellow";
}

// ── Component ──────────────────────────────────────────────────────────────

interface CVMatcherProps {
  opened: boolean;
  onClose: () => void;
}

export function CVMatcher({ opened, onClose }: CVMatcherProps) {
  const [cvText, setCvText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CVMatchResponse | null>(null);
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const { colorScheme } = useMantineColorScheme();
  const resetRef = useRef<() => void>(null);

  // Filter options
  const { filterOptions } = useFilterOptions();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [remoteOnly, setRemoteOnly] = useState<boolean | null>(null);
  const [roleKeyword, setRoleKeyword] = useState("");

  // ── Streaming progress simulation ──────────────────────────────────────

  const simulateProgress = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      const initial = STEP_LABELS.map((label, i) => ({
        label,
        done: false,
        active: i === 0,
      }));
      setSteps(initial);

      const delays = [1200, 2000, 2500];

      let stepIndex = 0;
      const advance = () => {
        if (stepIndex >= delays.length) {
          resolve();
          return;
        }
        setTimeout(() => {
          setSteps((prev) =>
            prev.map((s, i) => ({
              ...s,
              done: i <= stepIndex,
              active: i === stepIndex + 1,
            }))
          );
          stepIndex++;
          advance();
        }, delays[stepIndex]);
      };
      advance();
    });
  }, []);

  // ── PDF file handler ───────────────────────────────────────────────────

  const handlePdfSelect = (file: File | null) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("PDF must be under 5 MB.");
      return;
    }
    setPdfFile(file);
    setError(null);
  };

  const clearPdf = () => {
    setPdfFile(null);
    resetRef.current?.();
  };

  // ── Submit handler ─────────────────────────────────────────────────────

  const hasInput = pdfFile || cvText.trim().length >= 10;

  const handleSubmit = useCallback(async () => {
    if (!hasInput || loading) return;
    setError(null);
    setResult(null);
    setLoading(true);

    const progressPromise = simulateProgress();

    try {
      let res: Response;

      if (pdfFile) {
        // Upload PDF via FormData
        const formData = new FormData();
        formData.append("file", pdfFile);
        if (cvText.trim()) {
          formData.append("cv_text", cvText.trim());
        }
        // Add filters as JSON-encoded strings
        formData.append("countries", JSON.stringify(selectedCountries));
        formData.append("job_levels", JSON.stringify(selectedLevels));
        formData.append("job_functions", JSON.stringify(selectedFunctions));
        formData.append("platforms", JSON.stringify(selectedPlatforms));
        formData.append("is_remote", JSON.stringify(remoteOnly));
        formData.append("role_keyword", roleKeyword);

        res = await fetch("/api/ai/match-cv", {
          method: "POST",
          body: formData,
        });
      } else {
        // Text-only
        res = await fetch("/api/ai/match-cv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cv_text: cvText.trim(),
            countries: selectedCountries,
            job_levels: selectedLevels,
            job_functions: selectedFunctions,
            platforms: selectedPlatforms,
            is_remote: remoteOnly,
            role_keyword: roleKeyword,
          }),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Request failed.");
      }

      await progressPromise;

      setSteps((prev) => prev.map((s) => ({ ...s, done: true, active: false })));
      setResult(data as CVMatchResponse);
    } catch (err) {
      await progressPromise;
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [
    cvText,
    pdfFile,
    hasInput,
    loading,
    simulateProgress,
    selectedCountries,
    selectedLevels,
    selectedFunctions,
    selectedPlatforms,
    remoteOnly,
    roleKeyword,
  ]);

  // ── Reset ──────────────────────────────────────────────────────────────

  const handleReset = () => {
    setCvText("");
    setPdfFile(null);
    setResult(null);
    setError(null);
    setSteps([]);
    setLoading(false);
    setSelectedCountries([]);
    setSelectedLevels([]);
    setSelectedFunctions([]);
    setSelectedPlatforms([]);
    setRemoteOnly(null);
    setRoleKeyword("");
    setShowFilters(false);
    resetRef.current?.();
  };

  // ── Relevance scores ──────────────────────────────────────────────────

  const relevanceScores = result ? computeRelevanceScores(result.matches) : [];

  const isDark = colorScheme === "dark";

  return (
    <>
      <JobDetailsModal
        opened={!!selectedJobId}
        onClose={() => setSelectedJobId(null)}
        jobId={selectedJobId}
      />

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
            {/* Header */}
            <Box
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
                      background: "linear-gradient(135deg, #be4bdb 0%, #e64980 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(190,75,219,0.3)",
                    }}
                  >
                    <IconFileText size={20} color="#fff" />
                  </Box>
                  <Box>
                    <Text fw={600} size="md" lh={1.2}>
                      CV Match
                    </Text>
                    <Text size="xs" c="dimmed" lh={1.2}>
                      AI-powered job matching
                    </Text>
                  </Box>
                </Group>
                <Group gap={4}>
                  {(result || pdfFile || cvText) && (
                    <Tooltip label="Reset">
                      <ActionIcon variant="subtle" size="sm" color="gray" onClick={handleReset}>
                        <IconX size={16} />
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

            {/* Content */}
            <ScrollArea style={{ flex: 1, minHeight: 0 }} offsetScrollbars scrollbarSize={6}>
              <Box style={{ padding: "16px 20px" }}>
                <Stack gap="md">

          {/* Description */}
          <Text size="sm" c="dimmed">
            Paste your CV text or upload a PDF. We&apos;ll match it against
            job listings from the <strong>last 30 days</strong> using AI
            embeddings. Optionally, add filter criteria to narrow down results.
          </Text>

          {/* PDF Upload */}
          <Paper p="sm" withBorder>
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <IconUpload size={16} style={{ color: "var(--mantine-color-grape-5)" }} />
                <Text size="sm" fw={500}>
                  Upload PDF
                </Text>
              </Group>
              <Group gap="xs">
                {pdfFile && (
                  <>
                    <Badge variant="light" color="grape" size="sm">
                      {pdfFile.name}
                    </Badge>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="xs"
                      onClick={clearPdf}
                    >
                      <IconX size={12} />
                    </ActionIcon>
                  </>
                )}
                <FileButton
                  onChange={handlePdfSelect}
                  accept="application/pdf"
                  resetRef={resetRef}
                >
                  {(props) => (
                    <Button
                      {...props}
                      variant="light"
                      color="grape"
                      size="xs"
                      leftSection={<IconUpload size={14} />}
                      disabled={loading}
                    >
                      {pdfFile ? "Replace" : "Choose PDF"}
                    </Button>
                  )}
                </FileButton>
              </Group>
            </Group>
          </Paper>

          {/* Divider */}
          <Divider
            label={
              <Text size="xs" c="dimmed">
                or paste text below
              </Text>
            }
            labelPosition="center"
          />

          {/* CV Input */}
          <Textarea
            placeholder="Paste your CV / resume text here..."
            minRows={6}
            maxRows={12}
            autosize
            value={cvText}
            onChange={(e) => setCvText(e.currentTarget.value)}
            disabled={loading}
            styles={{
              input: { fontFamily: "monospace", fontSize: 13 },
            }}
          />

          {/* Filter Criteria Section */}
          <Paper p="sm" withBorder>
            <Button
              variant="subtle"
              fullWidth
              onClick={() => setShowFilters(!showFilters)}
              rightSection={showFilters ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
              leftSection={<IconFilter size={16} />}
              size="sm"
              disabled={loading}
            >
              <Group justify="space-between" style={{ flex: 1 }}>
                <Text size="sm">Filter Criteria (Optional)</Text>
                {(selectedCountries.length > 0 ||
                  selectedLevels.length > 0 ||
                  selectedFunctions.length > 0 ||
                  selectedPlatforms.length > 0 ||
                  remoteOnly !== null ||
                  roleKeyword.length > 0) && (
                  <Badge size="xs" variant="filled" color="grape">
                    Active
                  </Badge>
                )}
              </Group>
            </Button>

            <Collapse in={showFilters}>
              <Stack gap="sm" mt="sm">
                <Text size="xs" c="dimmed">
                  Narrow down your job matches by specifying countries, seniority levels, or other criteria.
                </Text>

                <MultiSelect
                  label="Countries"
                  placeholder="Select countries..."
                  data={filterOptions?.countries || []}
                  value={selectedCountries}
                  onChange={setSelectedCountries}
                  searchable
                  clearable
                  size="xs"
                  disabled={loading}
                />

                <MultiSelect
                  label="Seniority Levels"
                  placeholder="Select levels..."
                  data={filterOptions?.jobLevels || []}
                  value={selectedLevels}
                  onChange={setSelectedLevels}
                  searchable
                  clearable
                  size="xs"
                  disabled={loading}
                />

                <MultiSelect
                  label="Job Functions"
                  placeholder="Select functions..."
                  data={filterOptions?.jobFunctions || []}
                  value={selectedFunctions}
                  onChange={setSelectedFunctions}
                  searchable
                  clearable
                  size="xs"
                  disabled={loading}
                />

                <MultiSelect
                  label="Platforms"
                  placeholder="Select platforms..."
                  data={filterOptions?.platforms || []}
                  value={selectedPlatforms}
                  onChange={setSelectedPlatforms}
                  searchable
                  clearable
                  size="xs"
                  disabled={loading}
                />

                <TextInput
                  label="Role Keyword"
                  placeholder="e.g., Engineer, Manager..."
                  value={roleKeyword}
                  onChange={(e) => setRoleKeyword(e.currentTarget.value)}
                  size="xs"
                  disabled={loading}
                />

                <Group gap="sm">
                  <Text size="xs" fw={500}>
                    Remote Work:
                  </Text>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant={remoteOnly === true ? "filled" : "light"}
                      color="cyan"
                      onClick={() => setRemoteOnly(remoteOnly === true ? null : true)}
                      disabled={loading}
                    >
                      Remote Only
                    </Button>
                    <Button
                      size="xs"
                      variant={remoteOnly === false ? "filled" : "light"}
                      color="gray"
                      onClick={() => setRemoteOnly(remoteOnly === false ? null : false)}
                      disabled={loading}
                    >
                      On-site Only
                    </Button>
                    {remoteOnly !== null && (
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color="gray"
                        onClick={() => setRemoteOnly(null)}
                      >
                        <IconX size={12} />
                      </ActionIcon>
                    )}
                  </Group>
                </Group>

                <Button
                  size="xs"
                  variant="light"
                  color="gray"
                  onClick={() => {
                    setSelectedCountries([]);
                    setSelectedLevels([]);
                    setSelectedFunctions([]);
                    setSelectedPlatforms([]);
                    setRemoteOnly(null);
                    setRoleKeyword("");
                  }}
                  disabled={loading}
                >
                  Clear All Filters
                </Button>
              </Stack>
            </Collapse>
          </Paper>

          {/* Actions */}
          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              {pdfFile
                ? `PDF: ${pdfFile.name} (${(pdfFile.size / 1024).toFixed(0)} KB)`
                : cvText.length > 0
                ? `${cvText.length.toLocaleString()} characters`
                : "Upload PDF or paste text (min 10 chars)"}
            </Text>
            <Group gap="xs">
              {(result || pdfFile || cvText) && (
                <Button variant="subtle" size="xs" onClick={handleReset}>
                  Clear
                </Button>
              )}
              <Button
                leftSection={<IconSparkles size={16} />}
                onClick={handleSubmit}
                loading={loading}
                disabled={!hasInput}
              >
                Match Jobs
              </Button>
            </Group>
          </Group>

          {/* Progress Steps */}
          {steps.length > 0 && (
            <Paper p="md" withBorder>
              <Stack gap="xs">
                {steps.map((step, i) => (
                  <Group key={i} gap="sm">
                    {step.done ? (
                      <ThemeIcon size="sm" color="green" variant="light" radius="xl">
                        <IconCheck size={12} />
                      </ThemeIcon>
                    ) : step.active ? (
                      <Loader size={14} />
                    ) : (
                      <Box
                        w={22}
                        h={22}
                        style={{
                          borderRadius: "50%",
                          border: "2px solid var(--mantine-color-default-border)",
                        }}
                      />
                    )}
                    <Text
                      size="sm"
                      c={step.done ? "green" : step.active ? undefined : "dimmed"}
                      fw={step.active ? 600 : 400}
                    >
                      {step.label}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Paper>
          )}

          {/* Error */}
          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Error"
              color="red"
              variant="light"
            >
              {error}
            </Alert>
          )}

          {/* Results */}
          {result && result.matches.length > 0 && (
            <>
              <Group justify="space-between" align="center">
                <Text fw={600} size="sm">
                  Top Matches
                </Text>
                <Group gap="xs">
                  <Badge variant="light" color="gray" size="xs">
                    Last 30 days
                  </Badge>
                  <Badge variant="light" color="blue" size="sm">
                    {result.matches.length} results
                  </Badge>
                </Group>
              </Group>

              {/* Active Filters Display */}
              {(selectedCountries.length > 0 ||
                selectedLevels.length > 0 ||
                selectedFunctions.length > 0 ||
                selectedPlatforms.length > 0 ||
                remoteOnly !== null ||
                roleKeyword) && (
                <Paper p="xs" withBorder>
                  <Group gap={4}>
                    <IconFilter size={14} />
                    <Text size="xs" fw={500}>
                      Active Filters:
                    </Text>
                    {selectedCountries.map((c) => (
                      <Badge key={c} size="xs" variant="dot" color="grape">
                        {c}
                      </Badge>
                    ))}
                    {selectedLevels.map((l) => (
                      <Badge key={l} size="xs" variant="dot" color="orange">
                        {l}
                      </Badge>
                    ))}
                    {selectedFunctions.map((f) => (
                      <Badge key={f} size="xs" variant="dot" color="blue">
                        {f}
                      </Badge>
                    ))}
                    {selectedPlatforms.map((p) => (
                      <Badge key={p} size="xs" variant="dot" color="teal">
                        {p}
                      </Badge>
                    ))}
                    {remoteOnly === true && (
                      <Badge size="xs" variant="dot" color="cyan">
                        Remote
                      </Badge>
                    )}
                    {remoteOnly === false && (
                      <Badge size="xs" variant="dot" color="gray">
                        On-site
                      </Badge>
                    )}
                    {roleKeyword && (
                      <Badge size="xs" variant="dot" color="pink">
                        &quot;{roleKeyword}&quot;
                      </Badge>
                    )}
                  </Group>
                </Paper>
              )}

              {/* Relaxed Criteria Notice */}
              {result.matches.some((m) => m.relaxed_criteria) && (
                <Alert color="yellow" variant="light" icon={<IconAlertCircle size={16} />}>
                  <Text size="xs" component="span">
                    Some results don&apos;t match all your filter criteria but are shown as
                    best available alternatives. Look for the <Badge size="xs" variant="dot" color="yellow">Relaxed</Badge> badge.
                  </Text>
                </Alert>
              )}

              <Divider />

              <Stack gap="sm">
                {result.matches.map((match, i) => {
                  const { score, rank } = relevanceScores[i];
                  const rankColor = getRankColor(score);

                  return (
                    <Paper
                      key={match.job_id}
                      p="sm"
                      withBorder
                      onClick={() => setSelectedJobId(match.job_id)}
                      style={{
                        backgroundColor:
                          colorScheme === "dark"
                            ? "var(--mantine-color-dark-6)"
                            : "var(--mantine-color-gray-0)",
                        cursor: "pointer",
                      }}
                    >
                      <Stack gap={6}>
                        {/* Title & Link */}
                        <Group justify="space-between" align="flex-start" wrap="nowrap">
                          <Box style={{ flex: 1 }}>
                            <Group gap={6} wrap="nowrap">
                              {getRankIcon(rank)}
                              <Badge
                                variant="filled"
                                color={rankColor}
                                size="xs"
                                circle
                              >
                                {rank}
                              </Badge>
                              <Text fw={600} size="sm" lineClamp={2}>
                                {match.title}
                              </Text>
                            </Group>
                            <Group gap={4} mt={2}>
                              <IconBuilding size={13} style={{ color: "var(--mantine-color-dimmed)" }} />
                              <Text size="xs" c="dimmed">
                                {match.company}
                              </Text>
                            </Group>
                          </Box>
                          <Stack gap={4} align="flex-end">
                            <Badge
                              variant="light"
                              color={rankColor}
                              size="lg"
                            >
                              {score}% match
                            </Badge>
                            {match.relaxed_criteria && (
                              <Tooltip label="Doesn't match all your filter criteria, but shown as best available alternative">
                                <Badge
                                  variant="dot"
                                  color="yellow"
                                  size="xs"
                                >
                                  Relaxed
                                </Badge>
                              </Tooltip>
                            )}
                            <Group gap={4}>
                              <Tooltip label="View details">
                                <ActionIcon
                                  variant="subtle"
                                  color="grape"
                                  size="sm"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSelectedJobId(match.job_id);
                                  }}
                                >
                                  <IconEye size={16} />
                                </ActionIcon>
                              </Tooltip>
                              {match.url && (
                                <Tooltip label="Open job listing">
                                  <ActionIcon
                                    variant="subtle"
                                    color="blue"
                                    component="a"
                                    href={match.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="sm"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <IconExternalLink size={16} />
                                  </ActionIcon>
                                </Tooltip>
                              )}
                            </Group>
                          </Stack>
                        </Group>

                        {/* Location & Date */}
                        <Group gap="xs">
                          <Group gap={4}>
                            <IconMapPin size={12} style={{ color: "var(--mantine-color-dimmed)" }} />
                            <Text size="xs" c="dimmed">
                              {match.location || match.country || "—"}
                            </Text>
                          </Group>
                          <Text size="xs" c="dimmed">
                            •
                          </Text>
                          <Text size="xs" c="dimmed">
                            {formatDate(match.posted_date)}
                          </Text>
                          {match.is_remote && (
                            <Badge size="xs" variant="light" color="cyan">
                              Remote
                            </Badge>
                          )}
                        </Group>

                        {/* Badges */}
                        <Group gap={4}>
                          {match.job_level_std && match.job_level_std !== "NA" && (
                            <Badge
                              size="xs"
                              variant="light"
                              color={LEVEL_COLORS[match.job_level_std] ?? "gray"}
                            >
                              {match.job_level_std}
                            </Badge>
                          )}
                          {match.job_function_std && match.job_function_std !== "NA" && (
                            <Badge size="xs" variant="outline" color="blue">
                              {match.job_function_std}
                            </Badge>
                          )}
                          {match.job_type_filled && (
                            <Badge size="xs" variant="dot" color="gray">
                              {match.job_type_filled}
                            </Badge>
                          )}
                          {match.platform && (
                            <Badge
                              size="xs"
                              variant="light"
                              color={match.platform === "LinkedIn" ? "blue" : "orange"}
                            >
                              {match.platform}
                            </Badge>
                          )}
                        </Group>

                        {/* Job ID */}
                        <Text size="xs" c="dimmed" ff="monospace">
                          ID: {match.job_id}
                        </Text>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            </>
          )}

          {/* No matches */}
          {result && result.matches.length === 0 && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="No Matches"
              color="yellow"
              variant="light"
            >
              No matching jobs were found in the last 30 days. Try providing
              more detail in your CV.
            </Alert>
          )}
        </Stack>
              </Box>
            </ScrollArea>
          </Box>
        )}
      </Transition>
    </>
  );
}

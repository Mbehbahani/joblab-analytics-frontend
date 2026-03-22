"use client";

import { useState, useCallback, useRef } from "react";
import { recommendChart, type ChartRecommendation, type ChartResult } from "@/lib/chartRecommender";
import { useAiInsightStore } from "@/store/aiInsightStore";

export type AiJobResult = {
  job_id: string;
  actual_role: string;
  company_name: string;
  country?: string;
  location?: string;
  url?: string;
  posted_date?: string;
  job_level_std?: string;
  job_function_std?: string;
  job_type_filled?: string;
  platform?: string;
  is_remote?: boolean | number;
  is_research?: boolean | number;
  skills?: string;
  tools?: string;
};

export type AiMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  recommendation?: ChartRecommendation | null;
  semantic?: boolean;
  jobResults?: AiJobResult[] | null;
  mode?:
    | "semantic_search"
    | "job_stats"
    | "job_search"
    | "clarification"
    | "decline"
    | "handoff"
    | "error"
    | null;
  traceId?: string | null;
  conversationId?: string | null;
  turnId?: string | null;
  feedbackGiven?: "up" | "down" | null;
};

function detectAssistantMode(data: {
  tool_calls?: Array<{ name?: string }> | null;
  gate_outcome?: string | null;
  result_type?: string | null;
}): AiMessage["mode"] {
  const toolCalls = Array.isArray(data.tool_calls) ? data.tool_calls : [];

  if (toolCalls.some((tc) => tc.name === "semantic_search_jobs")) {
    return "semantic_search";
  }
  if (toolCalls.some((tc) => tc.name === "job_stats")) {
    return "job_stats";
  }
  if (toolCalls.some((tc) => tc.name === "search_jobs")) {
    return "job_search";
  }

  if (data.gate_outcome === "ASK_CLARIFICATION") {
    return "clarification";
  }
  if (data.gate_outcome === "DECLINE" || data.result_type === "decline") {
    return "decline";
  }
  if (data.gate_outcome === "HANDOFF") {
    return data.result_type === "error" ? "error" : "handoff";
  }
  if (data.result_type === "error") {
    return "error";
  }

  return null;
}

type AiSearchState = {
  messages: AiMessage[];
  loading: boolean;
  error: string | null;
};

/** Generate a short random id (browser-safe, no crypto needed). */
function generateId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Hook that calls the Next.js proxy route `/api/ai/search`.
 * Supports multi-turn conversations with message history.
 * When the backend returns tool_calls, automatically opens an
 * insight chart panel with the most relevant visualization.
 * Returns { messages, loading, error, search, reset }.
 */
export function useAiSearch() {
  const [state, setState] = useState<AiSearchState>({
    messages: [],
    loading: false,
    error: null,
  });

  // Stable conversation_id per chat session — reset on clear
  const conversationIdRef = useRef<string>(generateId());

  const search = useCallback(async (question: string) => {
    const userMessage: AiMessage = {
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      loading: true,
      error: null,
    }));

    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, conversation_id: conversationIdRef.current }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: data.error ?? "Request failed.",
        }));
        return;
      }

      const assistantMessage: AiMessage = {
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
        jobResults: Array.isArray(data.job_results) ? data.job_results : null,
        mode: detectAssistantMode(data),
        traceId: data.trace_id ?? null,
        conversationId: data.conversation_id ?? conversationIdRef.current,
        turnId: data.turn_id ?? null,
      };

      // ── Insight chart: map tool_calls → chart recommendation ──
      if (data.tool_calls && Array.isArray(data.tool_calls)) {
        // Detect semantic search mode
        const usedSemantic = data.tool_calls.some(
          (tc: { name: string }) => tc.name === "semantic_search_jobs"
        );
        if (usedSemantic) {
          assistantMessage.semantic = true;
          assistantMessage.mode = "semantic_search";
        }

        const chartResult: ChartResult = recommendChart(data.tool_calls);
        // Only show charts if NOT in semantic search mode
        if (!usedSemantic && chartResult.recommendation) {
          assistantMessage.recommendation = chartResult.recommendation;
          useAiInsightStore.getState().showChart(chartResult.recommendation);
        } else if (!usedSemantic && chartResult.noChartReason) {
          useAiInsightStore.getState().showNoChart(chartResult.noChartReason);
        }
      }

      setState((prev) => ({
        messages: [...prev.messages, assistantMessage],
        loading: false,
        error: null,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Network error. Please try again.",
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({ messages: [], loading: false, error: null });
    useAiInsightStore.getState().clear();
    conversationIdRef.current = generateId(); // new session
  }, []);

  /** Send thumbs-up / thumbs-down feedback for a specific assistant message. */
  const sendFeedback = useCallback(
    async (messageIndex: number, thumbsUp: boolean) => {
      const msg = state.messages[messageIndex];
      if (
        !msg ||
        msg.role !== "assistant" ||
        (!msg.traceId && !(msg.conversationId && msg.turnId))
      ) {
        return;
      }
      // Optimistically update the UI
      setState((prev) => {
        const updated = [...prev.messages];
        updated[messageIndex] = {
          ...updated[messageIndex],
          feedbackGiven: thumbsUp ? "up" : "down",
        };
        return { ...prev, messages: updated };
      });

      try {
        await fetch("/api/ai/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(msg.traceId ? { trace_id: msg.traceId } : {}),
            ...(msg.conversationId ? { conversation_id: msg.conversationId } : {}),
            ...(msg.turnId ? { turn_id: msg.turnId } : {}),
            thumbs_up: thumbsUp,
          }),
        });
      } catch {
        // Revert on failure
        setState((prev) => {
          const updated = [...prev.messages];
          updated[messageIndex] = {
            ...updated[messageIndex],
            feedbackGiven: null,
          };
          return { ...prev, messages: updated };
        });
      }
    },
    [state.messages]
  );

  return { ...state, search, reset, sendFeedback };
}

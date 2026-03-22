/**
 * Zustand store for AI insight chart state.
 * Decouples AiPanel (right drawer) from AiInsightPanel (left drawer).
 */

import { create } from "zustand";
import type { ChartRecommendation } from "@/lib/chartRecommender";

interface AiInsightState {
  /** Current chart recommendation (null = no chart to show) */
  recommendation: ChartRecommendation | null;
  /** Reason why no chart is available (null when a chart IS available) */
  noChartReason: string | null;
  /** Whether the left panel is open */
  panelOpen: boolean;
  /** Set a new chart recommendation and open the panel */
  showChart: (rec: ChartRecommendation) => void;
  /** Show the panel with a reason why no chart fits */
  showNoChart: (reason: string) => void;
  /** Open the panel (if recommendation exists) */
  openPanel: () => void;
  /** Close the panel (keeps recommendation for reopening) */
  closePanel: () => void;
  /** Clear recommendation and close panel */
  clear: () => void;
}

export const useAiInsightStore = create<AiInsightState>((set) => ({
  recommendation: null,
  noChartReason: null,
  panelOpen: false,

  showChart: (rec) =>
    set({ recommendation: rec, noChartReason: null, panelOpen: true }),

  showNoChart: (reason) =>
    set({ recommendation: null, noChartReason: reason, panelOpen: false }),

  openPanel: () =>
    set((state) => ({ panelOpen: state.recommendation ? true : state.panelOpen })),

  closePanel: () =>
    set({ panelOpen: false }),

  clear: () =>
    set({ recommendation: null, noChartReason: null, panelOpen: false }),
}));

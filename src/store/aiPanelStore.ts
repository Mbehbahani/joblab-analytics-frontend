import { create } from "zustand";

interface AiPanelState {
  open: boolean;
  toggle: () => void;
  setOpen: (v: boolean) => void;
}

export const useAiPanelStore = create<AiPanelState>((set) => ({
  open: false,
  toggle: () => set((s) => ({ open: !s.open })),
  setOpen: (v) => set({ open: v }),
}));

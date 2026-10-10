import { create } from "zustand";
import type { CityData } from "@canopy/shared";
import type { ViewMode } from "./scene/model";

interface CityState {
  city: CityData | null;
  selectedId: number | null;
  hoveredId: number | null;
  focusRequest: { fileId: number; nonce: number } | null;
  viewMode: ViewMode;
  showRoads: boolean;
  timelineFrame: number;
  isTimelinePlaying: boolean;
  error: string | null;
  setCity: (city: CityData) => void;
  setSelectedId: (id: number | null) => void;
  setHoveredId: (id: number | null) => void;
  requestFocus: (fileId: number) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setShowRoads: (showRoads: boolean) => void;
  setTimelineFrame: (frame: number) => void;
  setTimelinePlaying: (isPlaying: boolean) => void;
  setError: (message: string | null) => void;
}

export const useCityStore = create<CityState>((set) => ({
  city: null,
  selectedId: null,
  hoveredId: null,
  focusRequest: null,
  viewMode: "language",
  showRoads: false,
  timelineFrame: 0,
  isTimelinePlaying: false,
  error: null,
  setCity: (city) => set({ city, selectedId: null, hoveredId: null, focusRequest: null, timelineFrame: 0, isTimelinePlaying: false, error: null }),
  setSelectedId: (selectedId) => set({ selectedId }),
  setHoveredId: (hoveredId) => set({ hoveredId }),
  requestFocus: (fileId) => set((state) => ({ focusRequest: { fileId, nonce: (state.focusRequest?.nonce ?? 0) + 1 } })),
  setViewMode: (viewMode) => set({ viewMode }),
  setShowRoads: (showRoads) => set({ showRoads }),
  setTimelineFrame: (frame) => set((state) => ({ timelineFrame: clampTimelineFrame(frame, state.city) })),
  setTimelinePlaying: (isTimelinePlaying) => set({ isTimelinePlaying }),
  setError: (error) => set({ error }),
}));

function clampTimelineFrame(frame: number, city: CityData | null): number {
  const maxFrame = city?.timeline ? city.timeline.frameCount - 1 : 0;
  if (!Number.isFinite(frame)) {
    return 0;
  }

  return Math.max(0, Math.min(maxFrame, Math.round(frame)));
}

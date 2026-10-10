import { create } from "zustand";
import type { CityData } from "@canopy/shared";
import type { ViewMode } from "./scene/model";

interface CityState {
  city: CityData | null;
  selectedId: number | null;
  hoveredId: number | null;
  viewMode: ViewMode;
  timelineFrame: number;
  isTimelinePlaying: boolean;
  error: string | null;
  setCity: (city: CityData) => void;
  setSelectedId: (id: number | null) => void;
  setHoveredId: (id: number | null) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setTimelineFrame: (frame: number) => void;
  setTimelinePlaying: (isPlaying: boolean) => void;
  setError: (message: string | null) => void;
}

export const useCityStore = create<CityState>((set) => ({
  city: null,
  selectedId: null,
  hoveredId: null,
  viewMode: "language",
  timelineFrame: 0,
  isTimelinePlaying: false,
  error: null,
  setCity: (city) => set({ city, selectedId: null, hoveredId: null, timelineFrame: 0, isTimelinePlaying: false, error: null }),
  setSelectedId: (selectedId) => set({ selectedId }),
  setHoveredId: (hoveredId) => set({ hoveredId }),
  setViewMode: (viewMode) => set({ viewMode }),
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

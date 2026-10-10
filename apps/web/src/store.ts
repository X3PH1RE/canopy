import { create } from "zustand";
import type { CityData } from "@canopy/shared";

interface CityState {
  city: CityData | null;
  selectedId: number | null;
  hoveredId: number | null;
  error: string | null;
  setCity: (city: CityData) => void;
  setSelectedId: (id: number | null) => void;
  setHoveredId: (id: number | null) => void;
  setError: (message: string | null) => void;
}

export const useCityStore = create<CityState>((set) => ({
  city: null,
  selectedId: null,
  hoveredId: null,
  error: null,
  setCity: (city) => set({ city, selectedId: null, hoveredId: null, error: null }),
  setSelectedId: (selectedId) => set({ selectedId }),
  setHoveredId: (hoveredId) => set({ hoveredId }),
  setError: (error) => set({ error }),
}));

import { create } from "zustand";
import type { PropertyLocation } from "@/types/property";

export interface MapFilters {
  location?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  bathrooms?: number;
  status?: string;
}

interface MapState {
  center: [number, number];
  zoom: number;
  selectedPropertyId: string | null;
  hoveredPropertyId: string | null;
  activeFilters: MapFilters;
  visibleProperties: PropertyLocation[];
  mobileView: "map" | "list";
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setSelectedPropertyId: (id: string | null) => void;
  setHoveredPropertyId: (id: string | null) => void;
  setActiveFilters: (filters: MapFilters) => void;
  setVisibleProperties: (properties: PropertyLocation[]) => void;
  setMobileView: (view: "map" | "list") => void;
  resetFilters: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: [37.7749, -122.4194],
  zoom: 11,
  selectedPropertyId: null,
  hoveredPropertyId: null,
  activeFilters: {},
  visibleProperties: [],
  mobileView: "map",
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setSelectedPropertyId: (id) => set({ selectedPropertyId: id }),
  setHoveredPropertyId: (id) => set({ hoveredPropertyId: id }),
  setActiveFilters: (filters) => set({ activeFilters: filters }),
  setVisibleProperties: (properties) => set({ visibleProperties: properties }),
  setMobileView: (view) => set({ mobileView: view }),
  resetFilters: () =>
    set({
      activeFilters: {},
      selectedPropertyId: null,
      hoveredPropertyId: null,
      mobileView: "map"
    })
}));

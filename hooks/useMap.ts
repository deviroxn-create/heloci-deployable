"use client";

import { useMemo } from "react";
import { useMapStore } from "@/store/map.store";

export function useMap() {
  const center = useMapStore((state) => state.center);
  const zoom = useMapStore((state) => state.zoom);
  const selectedPropertyId = useMapStore((state) => state.selectedPropertyId);
  const hoveredPropertyId = useMapStore((state) => state.hoveredPropertyId);
  const activeFilters = useMapStore((state) => state.activeFilters);
  const visibleProperties = useMapStore((state) => state.visibleProperties);
  const mobileView = useMapStore((state) => state.mobileView);

  const mapOptions = useMemo(
    () => ({ center, zoom }),
    [center, zoom]
  );

  return {
    center,
    zoom,
    selectedPropertyId,
    hoveredPropertyId,
    activeFilters,
    visibleProperties,
    mobileView,
    mapOptions,
    setCenter: useMapStore((state) => state.setCenter),
    setZoom: useMapStore((state) => state.setZoom),
    setSelectedPropertyId: useMapStore((state) => state.setSelectedPropertyId),
    setHoveredPropertyId: useMapStore((state) => state.setHoveredPropertyId),
    setActiveFilters: useMapStore((state) => state.setActiveFilters),
    setVisibleProperties: useMapStore((state) => state.setVisibleProperties),
    setMobileView: useMapStore((state) => state.setMobileView),
    resetFilters: useMapStore((state) => state.resetFilters)
  };
}

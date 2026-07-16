"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMap = useMap;
const react_1 = require("react");
const map_store_1 = require("@/store/map.store");
function useMap() {
    const center = (0, map_store_1.useMapStore)((state) => state.center);
    const zoom = (0, map_store_1.useMapStore)((state) => state.zoom);
    const selectedPropertyId = (0, map_store_1.useMapStore)((state) => state.selectedPropertyId);
    const hoveredPropertyId = (0, map_store_1.useMapStore)((state) => state.hoveredPropertyId);
    const activeFilters = (0, map_store_1.useMapStore)((state) => state.activeFilters);
    const visibleProperties = (0, map_store_1.useMapStore)((state) => state.visibleProperties);
    const mobileView = (0, map_store_1.useMapStore)((state) => state.mobileView);
    const mapOptions = (0, react_1.useMemo)(() => ({ center, zoom }), [center, zoom]);
    return {
        center,
        zoom,
        selectedPropertyId,
        hoveredPropertyId,
        activeFilters,
        visibleProperties,
        mobileView,
        mapOptions,
        setCenter: (0, map_store_1.useMapStore)((state) => state.setCenter),
        setZoom: (0, map_store_1.useMapStore)((state) => state.setZoom),
        setSelectedPropertyId: (0, map_store_1.useMapStore)((state) => state.setSelectedPropertyId),
        setHoveredPropertyId: (0, map_store_1.useMapStore)((state) => state.setHoveredPropertyId),
        setActiveFilters: (0, map_store_1.useMapStore)((state) => state.setActiveFilters),
        setVisibleProperties: (0, map_store_1.useMapStore)((state) => state.setVisibleProperties),
        setMobileView: (0, map_store_1.useMapStore)((state) => state.setMobileView),
        resetFilters: (0, map_store_1.useMapStore)((state) => state.resetFilters)
    };
}

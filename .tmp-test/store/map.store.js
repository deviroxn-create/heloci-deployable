"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMapStore = void 0;
const zustand_1 = require("zustand");
exports.useMapStore = (0, zustand_1.create)((set) => ({
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
    resetFilters: () => set({
        activeFilters: {},
        selectedPropertyId: null,
        hoveredPropertyId: null,
        mobileView: "map"
    })
}));

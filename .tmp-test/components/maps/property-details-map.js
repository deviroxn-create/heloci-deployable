"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyDetailsMap = PropertyDetailsMap;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_leaflet_1 = require("react-leaflet");
require("leaflet/dist/leaflet.css");
const map_marker_1 = require("@/components/maps/map-marker");
const map_config_1 = require("@/lib/maps/map-config");
function deriveStatus(status) {
    const normalized = status?.toLowerCase() ?? "available";
    if (normalized.includes("occup"))
        return "occupied";
    if (normalized.includes("wait"))
        return "waitlist";
    return "available";
}
function PropertyDetailsMap({ property }) {
    const center = [property.latitude, property.longitude];
    return ((0, jsx_runtime_1.jsx)("div", { className: "overflow-hidden rounded-[32px] border border-border bg-white shadow-soft", children: (0, jsx_runtime_1.jsxs)(react_leaflet_1.MapContainer, { center: center, zoom: map_config_1.defaultMapZoom, scrollWheelZoom: false, className: "h-[520px] w-full", children: [(0, jsx_runtime_1.jsx)(react_leaflet_1.TileLayer, { attribution: map_config_1.tileLayerAttribution, url: map_config_1.tileLayerUrl }), (0, jsx_runtime_1.jsx)(react_leaflet_1.Marker, { position: center, icon: (0, map_marker_1.createMapMarkerIcon)(deriveStatus(property.status), true) })] }) }));
}

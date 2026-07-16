"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyMap = PropertyMap;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_leaflet_1 = require("react-leaflet");
require("leaflet/dist/leaflet.css");
const cluster_layer_1 = require("@/components/maps/cluster-layer");
const map_popup_1 = require("@/components/maps/map-popup");
const map_marker_1 = require("@/components/maps/map-marker");
const map_config_1 = require("@/lib/maps/map-config");
const deriveStatus = (status) => {
    const normalized = status?.toLowerCase() ?? "available";
    if (normalized.includes("occup"))
        return "occupied";
    if (normalized.includes("wait"))
        return "waitlist";
    return "available";
};
function hasValidCoordinates(property) {
    return typeof property.latitude === "number" && typeof property.longitude === "number" && Number.isFinite(property.latitude) && Number.isFinite(property.longitude);
}
function PropertyMap({ properties }) {
    const center = (0, react_1.useMemo)(() => {
        const validProperties = properties.filter(hasValidCoordinates);
        if (!validProperties.length) {
            return map_config_1.defaultMapCenter;
        }
        const [latSum, lngSum] = validProperties.reduce((acc, property) => [acc[0] + property.latitude, acc[1] + property.longitude], [0, 0]);
        return [latSum / validProperties.length, lngSum / validProperties.length];
    }, [properties]);
    return ((0, jsx_runtime_1.jsx)("div", { className: "overflow-hidden rounded-[32px] border border-border bg-white shadow-soft", children: (0, jsx_runtime_1.jsxs)(react_leaflet_1.MapContainer, { center: center, zoom: map_config_1.defaultMapZoom, scrollWheelZoom: false, className: "h-[420px] w-full", zoomControl: false, children: [(0, jsx_runtime_1.jsx)(react_leaflet_1.TileLayer, { attribution: map_config_1.tileLayerAttribution, url: map_config_1.tileLayerUrl }), (0, jsx_runtime_1.jsx)(cluster_layer_1.ClusterLayer, { children: properties.filter(hasValidCoordinates).map((property) => ((0, jsx_runtime_1.jsx)(react_leaflet_1.Marker, { position: [property.latitude, property.longitude], icon: (0, map_marker_1.createMapMarkerIcon)(deriveStatus(property.status)), children: (0, jsx_runtime_1.jsx)(react_leaflet_1.Popup, { children: (0, jsx_runtime_1.jsx)(map_popup_1.MapPopup, { property: property }) }) }, property.id))) })] }) }));
}

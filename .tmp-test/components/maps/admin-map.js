"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminMap = AdminMap;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_leaflet_1 = require("react-leaflet");
require("leaflet/dist/leaflet.css");
const map_marker_1 = require("@/components/maps/map-marker");
const map_config_1 = require("@/lib/maps/map-config");
function hasValidCoordinates(property) {
    return typeof property.latitude === "number" && typeof property.longitude === "number" && Number.isFinite(property.latitude) && Number.isFinite(property.longitude);
}
function SelectedPropertyZoom({ property }) {
    const map = (0, react_leaflet_1.useMap)();
    (0, react_1.useEffect)(() => {
        if (!property || !hasValidCoordinates(property))
            return;
        map.flyTo([property.latitude, property.longitude], 12, { duration: 0.7 });
    }, [map, property]);
    return null;
}
function deriveAdminStatus(status) {
    const normalized = status?.toLowerCase() ?? "available";
    if (normalized.includes("occup"))
        return "occupied";
    if (normalized.includes("wait"))
        return "waitlist";
    return "available";
}
function AdminMap({ properties, selectedPropertyId, onSelectProperty }) {
    const selectedProperty = (0, react_1.useMemo)(() => properties.find((property) => property.id === selectedPropertyId) ?? null, [properties, selectedPropertyId]);
    const center = (0, react_1.useMemo)(() => {
        if (selectedProperty && hasValidCoordinates(selectedProperty)) {
            return [selectedProperty.latitude, selectedProperty.longitude];
        }
        const validProperties = properties.filter(hasValidCoordinates);
        if (!validProperties.length) {
            return map_config_1.defaultMapCenter;
        }
        const average = validProperties.reduce((acc, property) => {
            acc[0] += property.latitude;
            acc[1] += property.longitude;
            return acc;
        }, [0, 0]);
        return [average[0] / validProperties.length, average[1] / validProperties.length];
    }, [properties, selectedProperty]);
    return ((0, jsx_runtime_1.jsx)("div", { className: "overflow-hidden rounded-[32px] border border-border bg-white shadow-soft", children: (0, jsx_runtime_1.jsxs)(react_leaflet_1.MapContainer, { center: center, zoom: selectedProperty ? 12 : map_config_1.defaultMapZoom, scrollWheelZoom: false, className: "h-[720px] w-full", zoomControl: true, children: [(0, jsx_runtime_1.jsx)(react_leaflet_1.TileLayer, { attribution: map_config_1.tileLayerAttribution, url: map_config_1.tileLayerUrl }), properties.filter(hasValidCoordinates).map((property) => {
                    const isSelected = property.id === selectedPropertyId;
                    return ((0, jsx_runtime_1.jsx)(react_leaflet_1.Marker, { position: [property.latitude, property.longitude], icon: (0, map_marker_1.createMapMarkerIcon)(deriveAdminStatus(property.status), isSelected), eventHandlers: { click: () => onSelectProperty(property) }, children: (0, jsx_runtime_1.jsx)(react_leaflet_1.Popup, { children: (0, jsx_runtime_1.jsxs)("div", { className: "w-72 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-soft", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs uppercase tracking-[0.32em] text-slate-400", children: property.status }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-lg font-semibold text-slate-950", children: property.title }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-2", children: [property.address, ", ", property.city] }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-3 text-sm text-slate-600", children: ["Rent $", property.rent, "/mo \u00B7 ", property.bedrooms, " beds \u00B7 ", property.bathrooms, " baths"] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600", children: "Inspect or edit" })] }) }) }, property.id));
                }), (0, jsx_runtime_1.jsx)(SelectedPropertyZoom, { property: selectedProperty })] }) }));
}

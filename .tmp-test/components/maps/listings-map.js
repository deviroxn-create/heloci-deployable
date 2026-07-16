"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingsMap = ListingsMap;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_leaflet_1 = require("react-leaflet");
require("leaflet/dist/leaflet.css");
const cluster_layer_1 = require("@/components/maps/cluster-layer");
const map_popup_1 = require("@/components/maps/map-popup");
const map_marker_1 = require("@/components/maps/map-marker");
const map_config_1 = require("@/lib/maps/map-config");
function hasValidCoordinates(property) {
    return typeof property.latitude === "number" && typeof property.longitude === "number" && Number.isFinite(property.latitude) && Number.isFinite(property.longitude);
}
function SelectedPropertyFocus({ property, zoom }) {
    const map = (0, react_leaflet_1.useMap)();
    (0, react_1.useEffect)(() => {
        if (!property || !hasValidCoordinates(property)) {
            return;
        }
        map.flyTo([property.latitude, property.longitude], zoom, {
            duration: 0.7
        });
    }, [property, map, zoom]);
    return null;
}
function deriveStatus(status) {
    const normalized = status?.toLowerCase() ?? "available";
    if (normalized.includes("occup"))
        return "occupied";
    if (normalized.includes("wait"))
        return "waitlist";
    return "available";
}
function ListingsMap({ properties, selectedPropertyId, onSelectProperty, onHoverProperty }) {
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
    return ((0, jsx_runtime_1.jsx)("div", { className: "overflow-hidden rounded-[32px] border border-border bg-white shadow-soft", children: (0, jsx_runtime_1.jsxs)(react_leaflet_1.MapContainer, { center: center, zoom: selectedProperty ? 13 : map_config_1.defaultMapZoom, scrollWheelZoom: false, className: "h-[680px] min-h-[420px] w-full", doubleClickZoom: false, zoomControl: true, children: [(0, jsx_runtime_1.jsx)(react_leaflet_1.TileLayer, { attribution: map_config_1.tileLayerAttribution, url: map_config_1.tileLayerUrl }), (0, jsx_runtime_1.jsx)(cluster_layer_1.ClusterLayer, { children: properties.filter(hasValidCoordinates).map((property) => {
                        const isSelected = property.id === selectedPropertyId;
                        return ((0, jsx_runtime_1.jsx)(react_leaflet_1.Marker, { position: [property.latitude, property.longitude], icon: (0, map_marker_1.createMapMarkerIcon)(deriveStatus(property.status), isSelected), eventHandlers: {
                                click: () => onSelectProperty(property),
                                mouseover: () => onHoverProperty(property.id),
                                mouseout: () => onHoverProperty(null)
                            }, children: (0, jsx_runtime_1.jsx)(react_leaflet_1.Popup, { children: (0, jsx_runtime_1.jsx)(map_popup_1.MapPopup, { property: property }) }) }, property.id));
                    }) }), (0, jsx_runtime_1.jsx)(SelectedPropertyFocus, { property: selectedProperty, zoom: 13 })] }) }));
}

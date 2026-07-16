"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutePreview = RoutePreview;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_leaflet_1 = require("react-leaflet");
const lucide_react_1 = require("lucide-react");
require("leaflet/dist/leaflet.css");
const distance_1 = require("@/lib/maps/distance");
const map_config_1 = require("@/lib/maps/map-config");
const destinations = [
    { key: "school", label: "School", coords: [37.7797, -122.4270] },
    { key: "work", label: "Work", coords: [37.7896, -122.4104] },
    { key: "hospital", label: "Hospital", coords: [37.7649, -122.4242] }
];
function RoutePreview({ origin }) {
    const [destinationKey, setDestinationKey] = (0, react_1.useState)(destinations[0].key);
    const [route, setRoute] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const destination = (0, react_1.useMemo)(() => destinations.find((item) => item.key === destinationKey) ?? destinations[0], [destinationKey]);
    (0, react_1.useEffect)(() => {
        let mounted = true;
        setRoute(null);
        setLoading(true);
        setError(null);
        const destCoords = destination.coords;
        (0, distance_1.getRoutePreview)([origin[0], origin[1]], [destCoords[0], destCoords[1]])
            .then((result) => {
            if (!mounted)
                return;
            if (!result) {
                setError("Unable to load route preview.");
                return;
            }
            setRoute(result);
        })
            .catch(() => {
            if (!mounted)
                return;
            setError("Unable to load route preview.");
        })
            .finally(() => {
            if (!mounted)
                return;
            setLoading(false);
        });
        return () => {
            mounted = false;
        };
    }, [destination, origin]);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[32px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm uppercase tracking-[0.24em] text-brand", children: "Route preview" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-2 text-2xl font-semibold text-slate-950", children: "Estimate travel to neighborhood essentials" })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-3", children: destinations.map((item) => ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setDestinationKey(item.key), className: `rounded-full px-4 py-2 text-sm font-semibold transition ${destinationKey === item.key ? "bg-brand text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`, children: item.label }, item.key))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 grid gap-6 lg:grid-cols-[0.95fr_0.6fr]", children: [(0, jsx_runtime_1.jsx)("div", { className: "overflow-hidden rounded-[28px] border border-border bg-slate-50", children: (0, jsx_runtime_1.jsxs)(react_leaflet_1.MapContainer, { center: origin, zoom: map_config_1.defaultMapZoom, scrollWheelZoom: false, className: "h-[340px] w-full", children: [(0, jsx_runtime_1.jsx)(react_leaflet_1.TileLayer, { attribution: map_config_1.tileLayerAttribution, url: map_config_1.tileLayerUrl }), (0, jsx_runtime_1.jsx)(react_leaflet_1.Marker, { position: origin }), (0, jsx_runtime_1.jsx)(react_leaflet_1.Marker, { position: destination.coords }), route ? (0, jsx_runtime_1.jsx)(react_leaflet_1.Polyline, { pathOptions: { color: "#003DB8", weight: 4, opacity: 0.9 }, positions: route.coordinates }) : null] }) }), (0, jsx_runtime_1.jsx)("div", { className: "rounded-[28px] border border-border bg-white p-5", children: loading ? ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-slate-600", children: "Loading route\u2026" })) : error ? ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-slate-600", children: error })) : route ? ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 text-slate-800", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MapPin, { className: "h-5 w-5 text-brand" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm uppercase tracking-[0.24em] text-slate-500", children: "Destination" }), (0, jsx_runtime_1.jsx)("p", { className: "font-semibold text-slate-950", children: destination.label })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-3xl bg-slate-50 p-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm text-slate-500", children: "Distance" }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-1 text-2xl font-semibold text-slate-950", children: [(route.distance / 1000).toFixed(1), " km"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-3xl bg-slate-50 p-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm text-slate-500", children: "Travel time" }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-1 text-2xl font-semibold text-slate-950", children: [Math.round(route.duration / 60), " min"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-3xl bg-brand/5 p-4 text-sm text-slate-700", children: [(0, jsx_runtime_1.jsx)("p", { className: "font-semibold text-brand", children: "Tip" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2", children: "Choose the destination type most important to your household and compare commute confidence." })] })] })) : ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-slate-600", children: "Select a route to see travel details." })) })] })] }));
}

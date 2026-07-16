"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NearbyServices = NearbyServices;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const useNearbyPlaces_1 = require("@/hooks/useNearbyPlaces");
const categories = [
    { key: "schools", label: "Schools", icon: lucide_react_1.School2 },
    { key: "hospitals", label: "Hospitals", icon: lucide_react_1.HeartPulse },
    { key: "transit", label: "Transit", icon: lucide_react_1.Bus },
    { key: "groceries", label: "Groceries", icon: lucide_react_1.ShoppingCart },
    { key: "pharmacies", label: "Pharmacies", icon: lucide_react_1.Pill }
];
function NearbyServices({ latitude, longitude }) {
    const { services, loading, error } = (0, useNearbyPlaces_1.useNearbyPlaces)(latitude, longitude, Boolean(latitude && longitude));
    return ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[32px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-between gap-4", children: (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm uppercase tracking-[0.24em] text-brand", children: "Nearby services" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-3 text-2xl font-semibold text-slate-950", children: "Local supports around the property" })] }) }), loading ? ((0, jsx_runtime_1.jsx)("p", { className: "mt-6 text-sm text-slate-600", children: "Loading nearby services\u2026" })) : error ? ((0, jsx_runtime_1.jsx)("p", { className: "mt-6 text-sm text-slate-600", children: "Unable to load nearby services. Please try again later." })) : ((0, jsx_runtime_1.jsx)("div", { className: "mt-6 grid gap-4 xl:grid-cols-2", children: categories.map((category) => {
                    const list = services[category.key];
                    const Icon = category.icon;
                    return ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-slate-200 bg-slate-50 p-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("span", { className: "inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-brand/10 text-brand", children: (0, jsx_runtime_1.jsx)(Icon, { className: "h-5 w-5" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-slate-950", children: category.label }), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-slate-500", children: ["Closest ", category.label.toLowerCase()] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-5 space-y-3", children: list.length ? (list.slice(0, 4).map((entry) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-3xl bg-white px-4 py-3 shadow-sm", children: [(0, jsx_runtime_1.jsx)("p", { className: "font-semibold text-slate-950", children: entry.name }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-slate-500", children: entry.address ?? "Nearby location" }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-2 text-xs uppercase tracking-[0.24em] text-slate-400", children: [Math.round(entry.distanceMeters), " m away"] })] }, entry.id)))) : ((0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-slate-500", children: ["No nearby ", category.label.toLowerCase(), " found within range."] })) })] }, category.key));
                }) }))] }));
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminPropertiesPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const admin_shell_1 = require("@/components/admin/admin-shell");
const button_1 = require("@/components/ui/button");
const properties = [
    {
        id: "PROP-001",
        title: "Cedar Grove Supportive Home",
        address: "120 Central Ave, Portland, OR 97209",
        rent: 720,
        bedrooms: 2,
        bathrooms: 1,
        sqft: 840,
        status: "Available",
        amenities: ["Transit access", "Community kitchen", "Service coordination"]
    },
    {
        id: "PROP-002",
        title: "Harborview Family Residence",
        address: "438 Harbor Blvd, Seattle, WA 98101",
        rent: 850,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1100,
        status: "Available",
        amenities: ["School access", "Medical shuttle", "Case manager"]
    },
    {
        id: "PROP-003",
        title: "Willow Lane Transitional Unit",
        address: "781 Willow Ln, Austin, TX 78701",
        rent: 680,
        bedrooms: 1,
        bathrooms: 1,
        sqft: 680,
        status: "Occupied",
        amenities: ["Vet services", "Counseling", "Transit"]
    },
    {
        id: "PROP-004",
        title: "Maple Street Veterans Home",
        address: "205 Maple St, Denver, CO 80203",
        rent: 590,
        bedrooms: 1,
        bathrooms: 1,
        sqft: 620,
        status: "Under review",
        amenities: ["VA support", "Employment help", "Peer support"]
    }
];
const statusStyles = {
    Available: "bg-success/10 text-success",
    Occupied: "bg-slate-100 text-slate-600",
    "Under review": "bg-warning/10 text-warning"
};
function AdminPropertiesPage() {
    return ((0, jsx_runtime_1.jsxs)(admin_shell_1.AdminShell, { title: "Property management", description: "Manage listings, update availability, and publish housing opportunities.", actions: (0, jsx_runtime_1.jsxs)(button_1.Button, { size: "sm", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-4 w-4 mr-2" }), "Add property"] }), children: [(0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 sm:grid-cols-3", children: [
                    { label: "Total listings", value: "64", color: "text-slate-950" },
                    { label: "Available", value: "41", color: "text-success" },
                    { label: "Occupied", value: "23", color: "text-slate-500" }
                ].map((item) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[24px] border border-border bg-white px-5 py-4 text-center shadow-soft", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-slate-500", children: item.label }), (0, jsx_runtime_1.jsx)("p", { className: `mt-2 text-2xl font-semibold tabular-nums ${item.color}`, children: item.value })] }, item.label))) }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-5 xl:grid-cols-2", children: properties.map((property) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Building2, { className: "h-5 w-5" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500", children: property.id }), (0, jsx_runtime_1.jsx)("h3", { className: "font-semibold text-slate-950", children: property.title })] })] }), (0, jsx_runtime_1.jsx)("span", { className: `shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[property.status]}`, children: property.status })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-4 flex items-center gap-2 text-sm text-slate-500", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MapPin, { className: "h-3.5 w-3.5 text-brand" }), property.address] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-4 grid grid-cols-3 gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl bg-slate-50 px-3 py-2.5 text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500", children: "Bedrooms" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-0.5 text-base font-semibold text-slate-950", children: property.bedrooms })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl bg-slate-50 px-3 py-2.5 text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500", children: "Bathrooms" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-0.5 text-base font-semibold text-slate-950", children: property.bathrooms })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl bg-slate-50 px-3 py-2.5 text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500", children: "Sq ft" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-0.5 text-base font-semibold tabular-nums text-slate-950", children: property.sqft })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-4 flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-lg font-semibold text-slate-950", children: ["$", property.rent, (0, jsx_runtime_1.jsx)("span", { className: "text-sm font-normal text-slate-500", children: "/mo" })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-1.5", children: property.amenities.slice(0, 2).map((a) => ((0, jsx_runtime_1.jsx)("span", { className: "rounded-full bg-brand/5 px-2.5 py-1 text-xs font-medium text-brand", children: a }, a))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-5 flex gap-2 border-t border-border pt-4", children: [(0, jsx_runtime_1.jsxs)("button", { type: "button", className: "flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border bg-white py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { className: "h-4 w-4" }), " View"] }), (0, jsx_runtime_1.jsxs)("button", { type: "button", className: "flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border bg-white py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Edit2, { className: "h-4 w-4" }), " Edit"] }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "flex items-center justify-center rounded-2xl border border-error/20 bg-error/5 px-3 py-2 text-sm font-medium text-error transition hover:bg-error/10", "aria-label": "Remove property", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { className: "h-4 w-4" }) })] })] }, property.id))) }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border-2 border-dashed border-border bg-white p-8 text-center shadow-soft", children: [(0, jsx_runtime_1.jsx)("div", { className: "mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-6 w-6" }) }), (0, jsx_runtime_1.jsx)("h3", { className: "mt-4 text-base font-semibold text-slate-950", children: "Add a new property" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-slate-500", children: "Publish a verified housing unit to the platform for applicant search and applications." }), (0, jsx_runtime_1.jsx)(button_1.Button, { className: "mt-5", size: "sm", children: "Add property listing" })] })] }));
}

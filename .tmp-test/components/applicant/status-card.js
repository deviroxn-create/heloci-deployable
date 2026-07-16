"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusCard = StatusCard;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const cards = [
    {
        title: "Active applications",
        value: "2",
        detail: "Applications in review",
        icon: lucide_react_1.Sparkles,
        accent: "bg-brand/10 text-brand"
    },
    {
        title: "Approved",
        value: "1",
        detail: "Ready to move forward",
        icon: lucide_react_1.ShieldCheck,
        accent: "bg-success/10 text-success"
    },
    {
        title: "Pending documents",
        value: "3",
        detail: "Uploads still needed",
        icon: lucide_react_1.FileText,
        accent: "bg-warning/10 text-warning"
    },
    {
        title: "Waiting on staff",
        value: "1",
        detail: "Response required",
        icon: lucide_react_1.Clock3,
        accent: "bg-slate-100 text-slate-900"
    }
];
function StatusCard() {
    return ((0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: cards.map((card) => {
            const Icon = card.icon;
            return ((0, jsx_runtime_1.jsxs)("article", { className: "rounded-[32px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsx)("div", { className: `inline-flex h-12 w-12 items-center justify-center rounded-3xl ${card.accent}`, children: (0, jsx_runtime_1.jsx)(Icon, { className: "h-5 w-5" }) }), (0, jsx_runtime_1.jsx)("p", { className: "mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500", children: card.title }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-3xl font-semibold text-slate-950", children: card.value }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-sm leading-6 text-slate-600", children: card.detail })] }, card.title));
        }) }));
}

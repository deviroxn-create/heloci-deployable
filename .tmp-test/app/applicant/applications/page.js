"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Page;
const jsx_runtime_1 = require("react/jsx-runtime");
const applicant_shell_1 = require("@/components/applicant/applicant-shell");
const button_1 = require("@/components/ui/button");
const applications = [
    {
        id: "APP-1123",
        program: "Family Support Program",
        status: "Pending",
        lastUpdate: "Today",
        note: "Awaiting income documentation",
        progress: 60
    },
    {
        id: "APP-1109",
        program: "Veteran Housing",
        status: "Approved",
        lastUpdate: "2 days ago",
        note: "Ready for move-in coordination",
        progress: 100
    }
];
function Page() {
    return ((0, jsx_runtime_1.jsx)(applicant_shell_1.ApplicantShell, { title: "My applications", description: "See application progress, timelines, and request updates from your housing team.", children: (0, jsx_runtime_1.jsx)("div", { className: "space-y-8", children: (0, jsx_runtime_1.jsx)("div", { className: "grid gap-6 xl:grid-cols-2", children: applications.map((application) => ((0, jsx_runtime_1.jsxs)("article", { className: "rounded-[32px] border border-border bg-white p-8 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm uppercase tracking-[0.24em] text-brand", children: application.id }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-3 text-2xl font-semibold text-slate-950", children: application.program })] }), (0, jsx_runtime_1.jsx)("span", { className: `rounded-full px-3 py-1 text-sm font-semibold ${application.status === "Approved" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`, children: application.status })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-sm leading-7 text-slate-600", children: application.note }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 rounded-3xl bg-slate-100 p-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between text-sm text-slate-600", children: [(0, jsx_runtime_1.jsx)("span", { children: "Progress" }), (0, jsx_runtime_1.jsxs)("span", { children: [application.progress, "%"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-3 h-3 overflow-hidden rounded-full bg-slate-200", children: (0, jsx_runtime_1.jsx)("div", { className: "h-full rounded-full bg-brand", style: { width: `${application.progress}%` } }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 flex flex-wrap gap-3", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", children: "View details" }), application.status !== "Approved" ? (0, jsx_runtime_1.jsx)(button_1.Button, { children: "Upload docs" }) : (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", children: "Contact staff" })] })] }, application.id))) }) }) }));
}

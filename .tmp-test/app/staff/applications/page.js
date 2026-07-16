"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StaffApplicationsPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const staff_shell_1 = require("@/components/staff/staff-shell");
// Button not used in this file
const cases = [
    {
        id: "APP-5412",
        name: "Amara Singh",
        email: "amara.singh@email.com",
        program: "Family Housing",
        status: "Pending",
        income: "$32,000",
        household: 4,
        submitted: "Jun 24, 2026",
        docsUploaded: 1,
        docsNeeded: 3
    },
    {
        id: "APP-5411",
        name: "Carlos Reyes",
        email: "carlos.r@email.com",
        program: "Veteran Housing",
        status: "Under review",
        income: "$28,500",
        household: 2,
        submitted: "Jun 22, 2026",
        docsUploaded: 3,
        docsNeeded: 3
    },
    {
        id: "APP-5408",
        name: "Priya Patel",
        email: "priya.p@email.com",
        program: "Transitional Housing",
        status: "Pending",
        income: "$26,000",
        household: 5,
        submitted: "Jun 17, 2026",
        docsUploaded: 0,
        docsNeeded: 3
    },
    {
        id: "APP-5410",
        name: "Lena Fischer",
        email: "lena.f@email.com",
        program: "Emergency Shelter",
        status: "Approved",
        income: "$21,000",
        household: 3,
        submitted: "Jun 20, 2026",
        docsUploaded: 3,
        docsNeeded: 3
    }
];
const statusStyles = {
    Pending: "bg-warning/10 text-warning",
    "Under review": "bg-brand/10 text-brand",
    Approved: "bg-success/10 text-success",
    Rejected: "bg-error/10 text-error"
};
function StaffApplicationsPage() {
    return ((0, jsx_runtime_1.jsxs)(staff_shell_1.StaffShell, { title: "My cases", description: "Manage your assigned housing applications and move them toward resolution.", children: [(0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 sm:grid-cols-4", children: [
                    { label: "Total assigned", value: "12", color: "text-slate-950" },
                    { label: "Pending", value: "6", color: "text-warning" },
                    { label: "In review", value: "4", color: "text-brand" },
                    { label: "Approved", value: "2", color: "text-success" }
                ].map((item) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[24px] border border-border bg-white px-5 py-4 text-center shadow-soft", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-slate-500", children: item.label }), (0, jsx_runtime_1.jsx)("p", { className: `mt-2 text-2xl font-semibold tabular-nums ${item.color}`, children: item.value })] }, item.label))) }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-4", children: cases.map((c) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-lg font-bold text-brand", children: c.name.charAt(0) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("p", { className: "font-semibold text-slate-950", children: c.name }), (0, jsx_runtime_1.jsx)("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[c.status]}`, children: c.status })] }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-slate-500", children: [c.id, " \u00B7 ", c.program, " \u00B7 Submitted ", c.submitted] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2 sm:shrink-0", children: [(0, jsx_runtime_1.jsxs)("button", { type: "button", className: "flex items-center gap-1.5 rounded-2xl border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { className: "h-4 w-4" }), " Review"] }), (0, jsx_runtime_1.jsxs)("button", { type: "button", className: "flex items-center gap-1.5 rounded-2xl border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MessageSquare, { className: "h-4 w-4" }), " Message"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-5 grid gap-3 sm:grid-cols-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl bg-slate-50 px-4 py-3", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500", children: "Annual income" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm font-semibold tabular-nums text-slate-950", children: c.income })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl bg-slate-50 px-4 py-3", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500", children: "Household size" }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-1 text-sm font-semibold text-slate-950", children: [c.household, " people"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl bg-slate-50 px-4 py-3 sm:col-span-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500", children: "Documents" }), (0, jsx_runtime_1.jsxs)("span", { className: "text-xs font-semibold text-slate-600", children: [c.docsUploaded, "/", c.docsNeeded] })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-2 h-2 rounded-full bg-slate-200", children: (0, jsx_runtime_1.jsx)("div", { className: `h-full rounded-full ${c.docsUploaded === c.docsNeeded ? "bg-success" : "bg-brand"}`, style: { width: `${(c.docsUploaded / c.docsNeeded) * 100}%` } }) })] })] }), c.status !== "Approved" ? ((0, jsx_runtime_1.jsxs)("div", { className: "mt-4 flex flex-wrap gap-2 border-t border-border pt-4", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs font-semibold text-slate-500 self-center", children: "Move to:" }), ["Under review", "Approved", "Rejected", "Waitlisted"]
                                    .filter((s) => s !== c.status)
                                    .map((s) => ((0, jsx_runtime_1.jsx)("button", { type: "button", className: "rounded-full border border-border bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand hover:bg-brand/5 hover:text-brand", children: s }, s)))] })) : null] }, c.id))) })] }));
}

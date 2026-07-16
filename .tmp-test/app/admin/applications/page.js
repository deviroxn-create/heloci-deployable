"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminApplicationsPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const admin_shell_1 = require("@/components/admin/admin-shell");
const button_1 = require("@/components/ui/button");
const applications = [
    {
        id: "APP-5412",
        name: "Amara Singh",
        email: "amara.singh@email.com",
        program: "Family Housing",
        status: "Pending",
        submitted: "Jun 24, 2026",
        income: "$32,000",
        household: 4
    },
    {
        id: "APP-5411",
        name: "Carlos Reyes",
        email: "carlos.r@email.com",
        program: "Veteran Housing",
        status: "Under review",
        submitted: "Jun 22, 2026",
        income: "$28,500",
        household: 2
    },
    {
        id: "APP-5410",
        name: "Lena Fischer",
        email: "lena.f@email.com",
        program: "Emergency Shelter",
        status: "Approved",
        submitted: "Jun 20, 2026",
        income: "$21,000",
        household: 3
    },
    {
        id: "APP-5409",
        name: "Darius Webb",
        email: "d.webb@email.com",
        program: "Family Housing",
        status: "Rejected",
        submitted: "Jun 18, 2026",
        income: "$58,000",
        household: 2
    },
    {
        id: "APP-5408",
        name: "Priya Patel",
        email: "priya.p@email.com",
        program: "Transitional Housing",
        status: "Waitlisted",
        submitted: "Jun 17, 2026",
        income: "$26,000",
        household: 5
    },
    {
        id: "APP-5407",
        name: "Marcus Johnson",
        email: "marcus.j@email.com",
        program: "Veteran Housing",
        status: "Approved",
        submitted: "Jun 15, 2026",
        income: "$19,000",
        household: 1
    }
];
const statusStyles = {
    Pending: "bg-warning/10 text-warning",
    "Under review": "bg-brand/10 text-brand",
    Approved: "bg-success/10 text-success",
    Rejected: "bg-error/10 text-error",
    Waitlisted: "bg-slate-100 text-slate-700"
};
const tabs = ["All", "Pending", "Under review", "Approved", "Rejected", "Waitlisted"];
function AdminApplicationsPage() {
    return ((0, jsx_runtime_1.jsxs)(admin_shell_1.AdminShell, { title: "Application queue", description: "Review, filter, and take action on all housing applications.", actions: (0, jsx_runtime_1.jsxs)(button_1.Button, { size: "sm", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Filter, { className: "h-4 w-4 mr-2" }), "Filter"] }), children: [(0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 sm:grid-cols-5", children: [
                    { label: "Total", value: "248", color: "text-slate-950" },
                    { label: "Pending", value: "89", color: "text-warning" },
                    { label: "Under review", value: "56", color: "text-brand" },
                    { label: "Approved", value: "76", color: "text-success" },
                    { label: "Rejected", value: "27", color: "text-error" }
                ].map((item) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[24px] border border-border bg-white px-5 py-4 shadow-soft text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-slate-500", children: item.label }), (0, jsx_runtime_1.jsx)("p", { className: `mt-2 text-2xl font-semibold tabular-nums ${item.color}`, children: item.value })] }, item.label))) }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-4 shadow-soft", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-1 items-center gap-2 rounded-2xl border border-border bg-slate-50 px-4 py-2.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "h-4 w-4 text-slate-400 shrink-0" }), (0, jsx_runtime_1.jsx)("input", { type: "search", placeholder: "Search by name, ID, or program\u2026", className: "w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400", "aria-label": "Search applications" })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hidden", children: tabs.map((tab) => ((0, jsx_runtime_1.jsx)("button", { type: "button", className: `shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${tab === "All"
                                ? "bg-brand text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`, children: tab }, tab))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white shadow-soft overflow-hidden", children: [(0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full text-sm", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "border-b border-border bg-slate-50", children: [(0, jsx_runtime_1.jsx)("th", { className: "px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500", children: "Applicant" }), (0, jsx_runtime_1.jsx)("th", { className: "px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500", children: "Program" }), (0, jsx_runtime_1.jsx)("th", { className: "px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500", children: "Income" }), (0, jsx_runtime_1.jsx)("th", { className: "px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500", children: "Household" }), (0, jsx_runtime_1.jsx)("th", { className: "px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500", children: "Submitted" }), (0, jsx_runtime_1.jsx)("th", { className: "px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500", children: "Status" }), (0, jsx_runtime_1.jsx)("th", { className: "px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-border", children: applications.map((app) => ((0, jsx_runtime_1.jsxs)("tr", { className: "transition hover:bg-slate-50", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-5 py-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-xs font-bold text-brand", children: app.name.charAt(0) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "font-semibold text-slate-950", children: app.name }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500", children: app.id })] })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-5 py-4 text-slate-700", children: app.program }), (0, jsx_runtime_1.jsx)("td", { className: "px-5 py-4 text-slate-700 tabular-nums", children: app.income }), (0, jsx_runtime_1.jsx)("td", { className: "px-5 py-4 text-slate-700", children: app.household }), (0, jsx_runtime_1.jsx)("td", { className: "px-5 py-4 text-slate-500 text-xs", children: app.submitted }), (0, jsx_runtime_1.jsx)("td", { className: "px-5 py-4", children: (0, jsx_runtime_1.jsx)("span", { className: `rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[app.status]}`, children: app.status }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-5 py-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: "inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white text-slate-600 transition hover:border-brand hover:text-brand", "aria-label": `View ${app.name}`, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { className: "h-3.5 w-3.5" }) }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white text-slate-600 transition hover:border-brand hover:text-brand", "aria-label": `Message ${app.name}`, children: (0, jsx_runtime_1.jsx)(lucide_react_1.MessageSquare, { className: "h-3.5 w-3.5" }) })] }) })] }, app.id))) })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between border-t border-border px-5 py-4 text-sm text-slate-500", children: [(0, jsx_runtime_1.jsx)("p", { children: "Showing 6 of 248" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: "rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50", children: "Previous" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "rounded-xl bg-brand px-3 py-1.5 text-xs font-medium text-white", children: "Next" })] })] })] })] }));
}

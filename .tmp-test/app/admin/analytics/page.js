"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminAnalyticsPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const admin_shell_1 = require("@/components/admin/admin-shell");
const button_1 = require("@/components/ui/button");
const kpis = [
    {
        title: "Applications this month",
        value: "114",
        change: "+18%",
        trend: "up",
        icon: lucide_react_1.BarChart3,
        accent: "bg-brand/10 text-brand"
    },
    {
        title: "Approval rate",
        value: "71%",
        change: "+4%",
        trend: "up",
        icon: lucide_react_1.CheckCircle2,
        accent: "bg-success/10 text-success"
    },
    {
        title: "Avg. time to decision",
        value: "5.2 days",
        change: "-0.8 days",
        trend: "up",
        icon: lucide_react_1.Clock3,
        accent: "bg-info/10 text-info"
    },
    {
        title: "Active applicants",
        value: "1,042",
        change: "+38",
        trend: "up",
        icon: lucide_react_1.Users,
        accent: "bg-warning/10 text-warning"
    }
];
const monthlyVolume = [
    { month: "Jan", applications: 74, approved: 48 },
    { month: "Feb", applications: 82, approved: 56 },
    { month: "Mar", applications: 91, approved: 60 },
    { month: "Apr", applications: 78, approved: 52 },
    { month: "May", applications: 99, approved: 72 },
    { month: "Jun", applications: 114, approved: 81 }
];
const programBreakdown = [
    { program: "Family Housing", count: 186, pct: 42 },
    { program: "Veteran Housing", count: 110, pct: 25 },
    { program: "Emergency Shelter", count: 79, pct: 18 },
    { program: "Transitional Housing", count: 66, pct: 15 }
];
const outcomeData = [
    { label: "Approved", value: 76, color: "bg-success" },
    { label: "Pending", value: 89, color: "bg-warning" },
    { label: "Under review", value: 56, color: "bg-brand" },
    { label: "Waitlisted", value: 27, color: "bg-slate-300" },
    { label: "Rejected", value: 27, color: "bg-error" }
];
const maxVolume = Math.max(...monthlyVolume.map((m) => m.applications));
function AdminAnalyticsPage() {
    return ((0, jsx_runtime_1.jsxs)(admin_shell_1.AdminShell, { title: "Analytics", description: "Program metrics, approval rates, and applicant cohort outcomes.", actions: (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "outline", children: "Export report" }), children: [(0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4", children: kpis.map((kpi) => {
                    const Icon = kpi.icon;
                    return ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsx)("div", { className: `inline-flex h-11 w-11 items-center justify-center rounded-3xl ${kpi.accent}`, children: (0, jsx_runtime_1.jsx)(Icon, { className: "h-5 w-5" }) }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500", children: kpi.title }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-3xl font-semibold tabular-nums text-slate-950", children: kpi.value }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-2 flex items-center gap-1", children: [kpi.trend === "up" ? ((0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { className: "h-3.5 w-3.5 text-success" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.TrendingDown, { className: "h-3.5 w-3.5 text-error" })), (0, jsx_runtime_1.jsx)("span", { className: "text-xs font-semibold text-success", children: kpi.change }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-slate-400", children: "vs last month" })] })] }, kpi.title));
                }) }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-6 xl:grid-cols-[1.5fr_1fr]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-brand", children: "Volume" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-1 text-lg font-semibold text-slate-950", children: "Monthly applications vs approvals" }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 flex items-end justify-between gap-2 h-40", children: monthlyVolume.map((item) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-1 flex-col items-center gap-1.5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center gap-1 w-full", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-full rounded-t-xl bg-brand/20", style: { height: `${(item.applications / maxVolume) * 120}px` }, title: `${item.applications} applications` }), (0, jsx_runtime_1.jsx)("div", { className: "w-full rounded-t-xl bg-brand", style: { height: `${(item.approved / maxVolume) * 120}px`, marginTop: "-4px" }, title: `${item.approved} approved` })] }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-slate-500", children: item.month })] }, item.month))) }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-4 flex items-center gap-4 text-xs text-slate-600", children: [(0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)("span", { className: "inline-block h-2.5 w-2.5 rounded-sm bg-brand/20" }), "Applications"] }), (0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)("span", { className: "inline-block h-2.5 w-2.5 rounded-sm bg-brand" }), "Approvals"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-brand", children: "Outcomes" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-1 text-lg font-semibold text-slate-950", children: "Application status breakdown" }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 space-y-3", children: outcomeData.map((item) => {
                                    const total = outcomeData.reduce((sum, d) => sum + d.value, 0);
                                    const pct = Math.round((item.value / total) * 100);
                                    return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between text-sm mb-1", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-slate-700", children: item.label }), (0, jsx_runtime_1.jsxs)("span", { className: "font-semibold tabular-nums text-slate-950", children: [item.value, " ", (0, jsx_runtime_1.jsxs)("span", { className: "text-xs text-slate-400 font-normal", children: ["(", pct, "%)"] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "h-2 w-full rounded-full bg-slate-100", children: (0, jsx_runtime_1.jsx)("div", { className: `h-full rounded-full ${item.color}`, style: { width: `${pct}%` } }) })] }, item.label));
                                }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-brand", children: "Programs" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-1 text-lg font-semibold text-slate-950", children: "Applications by program" }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4", children: programBreakdown.map((item) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[24px] bg-slate-50 p-5", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-slate-950", children: item.program }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-2xl font-semibold tabular-nums text-slate-950", children: item.count }), (0, jsx_runtime_1.jsx)("div", { className: "mt-3 h-2 w-full rounded-full bg-slate-200", children: (0, jsx_runtime_1.jsx)("div", { className: "h-full rounded-full bg-brand", style: { width: `${item.pct}%` } }) }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-2 text-xs text-slate-500", children: [item.pct, "% of total"] })] }, item.program))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-brand", children: "Efficiency" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-1 text-lg font-semibold text-slate-950", children: "Average time to decision" }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4", children: [
                            { label: "Family Housing", days: "5.4 days", change: "-0.6" },
                            { label: "Veteran Housing", days: "4.1 days", change: "-1.2" },
                            { label: "Emergency Shelter", days: "2.8 days", change: "-0.3" },
                            { label: "Transitional Housing", days: "6.2 days", change: "+0.4" }
                        ].map((item) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[24px] bg-slate-50 p-5", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold text-slate-500", children: item.label }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-xl font-semibold text-slate-950", children: item.days }), (0, jsx_runtime_1.jsxs)("p", { className: `mt-1 text-xs font-semibold ${item.change.startsWith("-") ? "text-success" : "text-error"}`, children: [item.change, " days vs last month"] })] }, item.label))) })] })] }));
}

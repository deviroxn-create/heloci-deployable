"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StaffReportsPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const staff_shell_1 = require("@/components/staff/staff-shell");
const button_1 = require("@/components/ui/button");
const personalStats = [
    { label: "Cases resolved this month", value: "9", change: "+3 vs last month", trend: "up" },
    { label: "Avg. time to first response", value: "2.8h", change: "-0.4h vs last month", trend: "up" },
    { label: "Avg. time to decision", value: "4.6 days", change: "-0.9 days", trend: "up" },
    { label: "Pending cases", value: "3", change: "Same as last month", trend: "neutral" }
];
const weeklyActivity = [
    { day: "Mon", cases: 4 },
    { day: "Tue", cases: 7 },
    { day: "Wed", cases: 3 },
    { day: "Thu", cases: 6 },
    { day: "Fri", cases: 5 },
    { day: "Sat", cases: 1 },
    { day: "Sun", cases: 0 }
];
const maxCases = Math.max(...weeklyActivity.map((d) => d.cases));
function StaffReportsPage() {
    return ((0, jsx_runtime_1.jsxs)(staff_shell_1.StaffShell, { title: "My reports", description: "Personal performance metrics, case throughput, and resolution trends.", actions: (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", variant: "outline", children: "Export" }), children: [(0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4", children: personalStats.map((stat) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-5 shadow-soft", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-slate-500", children: stat.label }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-2xl font-semibold tabular-nums text-slate-950", children: stat.value }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-2 flex items-center gap-1", children: [stat.trend === "up" ? ((0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { className: "h-3.5 w-3.5 text-success" })) : stat.trend === "down" ? ((0, jsx_runtime_1.jsx)(lucide_react_1.TrendingDown, { className: "h-3.5 w-3.5 text-error" })) : null, (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-slate-500", children: stat.change })] })] }, stat.label))) }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-6 xl:grid-cols-[1.2fr_0.8fr]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-brand", children: "Activity" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-1 text-lg font-semibold text-slate-950", children: "Cases handled this week" }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 flex items-end justify-between gap-3 h-36", children: weeklyActivity.map((day) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-1 flex-col items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: `w-full rounded-t-xl transition-all ${day.cases > 0 ? "bg-brand" : "bg-slate-100"}`, style: { height: `${maxCases > 0 ? (day.cases / maxCases) * 120 : 8}px`, minHeight: "8px" }, title: `${day.cases} cases` }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-slate-500", children: day.day })] }, day.day))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-brand", children: "Outcomes" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-1 text-lg font-semibold text-slate-950", children: "My case results" }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 space-y-4", children: [
                                    { label: "Approved", value: 18, color: "bg-success", pct: 75 },
                                    { label: "Rejected", value: 3, color: "bg-error", pct: 12.5 },
                                    { label: "Waitlisted", value: 3, color: "bg-slate-300", pct: 12.5 }
                                ].map((item) => ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between text-sm mb-1.5", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-slate-700", children: item.label }), (0, jsx_runtime_1.jsx)("span", { className: "font-semibold text-slate-950", children: item.value })] }), (0, jsx_runtime_1.jsx)("div", { className: "h-2 w-full rounded-full bg-slate-100", children: (0, jsx_runtime_1.jsx)("div", { className: `h-full rounded-full ${item.color}`, style: { width: `${item.pct}%` } }) })] }, item.label))) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-brand", children: "Bottlenecks" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-1 text-lg font-semibold text-slate-950", children: "Where cases get delayed" }), (0, jsx_runtime_1.jsx)("div", { className: "mt-5 grid gap-4 sm:grid-cols-3", children: [
                            { stage: "Document collection", avgDays: "2.4 days", note: "Applicants slow to upload" },
                            { stage: "Income verification", avgDays: "1.8 days", note: "Typically clears quickly" },
                            { stage: "Final review", avgDays: "0.8 days", note: "Fastest stage" }
                        ].map((item) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[24px] bg-slate-50 p-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 text-brand", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock3, { className: "h-4 w-4" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.2em]", children: item.stage })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-xl font-semibold text-slate-950", children: item.avgDays }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-xs text-slate-500", children: item.note })] }, item.stage))) })] })] }));
}

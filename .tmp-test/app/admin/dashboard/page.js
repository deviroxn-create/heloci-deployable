"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminDashboardPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
const admin_shell_1 = require("@/components/admin/admin-shell");
const button_1 = require("@/components/ui/button");
const stats = [
    {
        title: "Total applications",
        value: "248",
        change: "+14 this week",
        icon: lucide_react_1.ClipboardList,
        accent: "bg-brand/10 text-brand"
    },
    {
        title: "Active users",
        value: "1,042",
        change: "+38 this month",
        icon: lucide_react_1.Users,
        accent: "bg-success/10 text-success"
    },
    {
        title: "Properties listed",
        value: "64",
        change: "12 new this month",
        icon: lucide_react_1.Building2,
        accent: "bg-info/10 text-info"
    },
    {
        title: "Approval rate",
        value: "71%",
        change: "+4% vs last month",
        icon: lucide_react_1.TrendingUp,
        accent: "bg-warning/10 text-warning"
    }
];
const recentApplications = [
    { id: "APP-5412", name: "Amara Singh", program: "Family Housing", status: "Pending", time: "2h ago" },
    { id: "APP-5411", name: "Carlos Reyes", program: "Veteran Housing", status: "Under review", time: "4h ago" },
    { id: "APP-5410", name: "Lena Fischer", program: "Emergency Shelter", status: "Approved", time: "Yesterday" },
    { id: "APP-5409", name: "Darius Webb", program: "Family Housing", status: "Rejected", time: "Yesterday" },
    { id: "APP-5408", name: "Priya Patel", program: "Transitional Housing", status: "Waitlisted", time: "2 days ago" }
];
const statusStyles = {
    Pending: "bg-warning/10 text-warning",
    "Under review": "bg-brand/10 text-brand",
    Approved: "bg-success/10 text-success",
    Rejected: "bg-error/10 text-error",
    Waitlisted: "bg-slate-100 text-slate-700"
};
const auditActivity = [
    { action: "Status updated to Approved", entity: "Application APP-5410", user: "Staff: Maya T.", time: "4h ago" },
    { action: "New property added", entity: "Willow Creek Unit #4B", user: "Admin: David N.", time: "6h ago" },
    { action: "User role changed to STAFF", entity: "Marcus D.", user: "Admin: David N.", time: "Yesterday" },
    { action: "Application rejected", entity: "APP-5409", user: "Staff: Priya A.", time: "Yesterday" }
];
function AdminDashboardPage() {
    return ((0, jsx_runtime_1.jsxs)(admin_shell_1.AdminShell, { title: "Admin dashboard", description: "Platform health, pending actions, and audit activity at a glance.", actions: (0, jsx_runtime_1.jsx)(link_1.default, { href: "/admin/applications", children: (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", children: "Open application queue" }) }), children: [(0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4", children: stats.map((stat) => {
                    const Icon = stat.icon;
                    return ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsx)("div", { className: `inline-flex h-11 w-11 items-center justify-center rounded-3xl ${stat.accent}`, children: (0, jsx_runtime_1.jsx)(Icon, { className: "h-5 w-5" }) }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500", children: stat.title }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-3xl font-semibold tabular-nums text-slate-950", children: stat.value }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-xs text-slate-500", children: stat.change })] }, stat.title));
                }) }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-6 xl:grid-cols-[1.4fr_0.6fr]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-4 mb-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-brand", children: "Applications" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-1 text-lg font-semibold text-slate-950", children: "Recent submissions" })] }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/admin/applications", children: (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", size: "sm", children: "View all" }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: recentApplications.map((app) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-border text-xs font-bold text-slate-700 shadow-sm", children: app.name.charAt(0) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-slate-950", children: app.name }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-slate-500", children: [app.id, " \u00B7 ", app.program] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("span", { className: `rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[app.status]}`, children: app.status }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-slate-400 hidden sm:block", children: app.time })] })] }, app.id))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-5 shadow-soft", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 mb-4", children: "Quick actions" }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: [
                                            { label: "Review pending applications", href: "/admin/applications", icon: lucide_react_1.ClipboardList },
                                            { label: "Manage staff roster", href: "/admin/staff", icon: lucide_react_1.Users },
                                            { label: "Add new property", href: "/admin/properties", icon: lucide_react_1.Building2 },
                                            { label: "View analytics", href: "/admin/analytics", icon: lucide_react_1.TrendingUp }
                                        ].map((item) => {
                                            const Icon = item.icon;
                                            return ((0, jsx_runtime_1.jsxs)(link_1.default, { href: item.href, className: "flex items-center justify-between rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950", children: [(0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(Icon, { className: "h-4 w-4 text-brand" }), item.label] }), (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "h-3.5 w-3.5 text-slate-400" })] }, item.href));
                                        }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-warning/20 bg-warning/5 p-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mb-3", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { className: "h-4 w-4 text-warning" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-warning", children: "Needs attention" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl bg-white p-3", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-slate-950", children: "12 documents unreviewed" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500 mt-1", children: "Submitted over 48 hours ago" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl bg-white p-3", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-slate-950", children: "3 staff accounts inactive" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500 mt-1", children: "No login in 30+ days" })] })] })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-4 mb-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-brand", children: "Audit trail" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-1 text-lg font-semibold text-slate-950", children: "Recent activity" })] }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/admin/analytics", children: (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "ghost", size: "sm", children: "View full log" }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: auditActivity.map((entry, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-4 rounded-2xl bg-slate-50 px-4 py-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white border border-border shadow-sm", children: (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "h-3.5 w-3.5 text-brand" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 min-w-0", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-slate-950", children: entry.action }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-slate-500 mt-0.5", children: [entry.entity, " \u00B7 ", entry.user] })] }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-slate-400 shrink-0", children: entry.time })] }, i))) })] })] }));
}

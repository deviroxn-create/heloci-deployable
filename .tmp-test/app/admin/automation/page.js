"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminAutomationPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const admin_shell_1 = require("@/components/admin/admin-shell");
const button_1 = require("@/components/ui/button");
const rules = [
    {
        id: "RULE-001",
        name: "Auto-assign new applications",
        trigger: "Application submitted",
        action: "Assign to least-loaded staff member",
        enabled: true,
        runs: 248
    },
    {
        id: "RULE-002",
        name: "Document reminder",
        trigger: "Application pending > 3 days",
        action: "Send applicant email: 'Documents needed'",
        enabled: true,
        runs: 92
    },
    {
        id: "RULE-003",
        name: "Approval notification",
        trigger: "Application status → Approved",
        action: "Send approval email + notify case manager",
        enabled: true,
        runs: 76
    },
    {
        id: "RULE-004",
        name: "Rejection email",
        trigger: "Application status → Rejected",
        action: "Send rejection email with next steps",
        enabled: true,
        runs: 27
    },
    {
        id: "RULE-005",
        name: "Weekly digest report",
        trigger: "Every Monday 9am",
        action: "Email admin: weekly application summary",
        enabled: false,
        runs: 12
    }
];
function AdminAutomationPage() {
    return ((0, jsx_runtime_1.jsxs)(admin_shell_1.AdminShell, { title: "Automation rules", description: "Configure workflow automations that route applications, trigger emails, and simplify staff handoffs.", actions: (0, jsx_runtime_1.jsxs)(button_1.Button, { size: "sm", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-4 w-4 mr-2" }), "New rule"] }), children: [(0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 sm:grid-cols-3", children: [
                    { label: "Active rules", value: "4" },
                    { label: "Total rule runs", value: "455" },
                    { label: "Emails sent", value: "341" }
                ].map((item) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[24px] border border-border bg-white px-5 py-4 text-center shadow-soft", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-slate-500", children: item.label }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-2xl font-semibold tabular-nums text-slate-950", children: item.value })] }, item.label))) }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-4", children: rules.map((rule) => ((0, jsx_runtime_1.jsx)("div", { className: `rounded-[28px] border bg-white p-6 shadow-soft transition ${rule.enabled ? "border-border" : "border-border opacity-60"}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: `mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${rule.enabled ? "bg-brand/10 text-brand" : "bg-slate-100 text-slate-400"}`, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold text-slate-950", children: rule.name }), (0, jsx_runtime_1.jsx)("span", { className: `rounded-full px-2 py-0.5 text-xs font-semibold ${rule.enabled ? "bg-success/10 text-success" : "bg-slate-100 text-slate-500"}`, children: rule.enabled ? "Active" : "Disabled" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-2 grid gap-1 text-sm text-slate-600", children: [(0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("span", { className: "font-semibold text-slate-700", children: "Trigger:" }), " ", rule.trigger] }), (0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("span", { className: "font-semibold text-slate-700", children: "Action:" }), " ", rule.action] })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 shrink-0", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-xs text-slate-400", children: [rule.runs, " runs"] }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white text-slate-600 transition hover:border-brand hover:text-brand", "aria-label": `Edit ${rule.name}`, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit2, { className: "h-3.5 w-3.5" }) }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: `inline-flex h-8 w-8 items-center justify-center rounded-xl border transition ${rule.enabled ? "border-success/20 bg-success/5 text-success hover:bg-success/10" : "border-border bg-slate-50 text-slate-400 hover:bg-slate-100"}`, "aria-label": rule.enabled ? `Disable ${rule.name}` : `Enable ${rule.name}`, children: rule.enabled ? (0, jsx_runtime_1.jsx)(lucide_react_1.ToggleRight, { className: "h-4 w-4" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.ToggleLeft, { className: "h-4 w-4" }) })] })] }) }, rule.id))) }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border-2 border-dashed border-border bg-white p-8 text-center shadow-soft", children: [(0, jsx_runtime_1.jsx)("div", { className: "mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-6 w-6" }) }), (0, jsx_runtime_1.jsx)("h3", { className: "mt-4 text-base font-semibold text-slate-950", children: "Create a new automation rule" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-slate-500 max-w-md mx-auto", children: "Define custom triggers and actions to automate routing, notifications, and reporting workflows." }), (0, jsx_runtime_1.jsx)(button_1.Button, { className: "mt-5", size: "sm", children: "Add rule" })] })] }));
}

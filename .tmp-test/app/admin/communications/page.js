"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CommunicationsPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const admin_shell_1 = require("@/components/admin/admin-shell");
const communication_dashboard_1 = require("@/components/admin/communication-dashboard");
const notifications_actions_1 = require("@/actions/notifications.actions");
// Link not used in this file
const metricCards = [
    { key: "total", label: "Total Notifications" },
    { key: "today", label: "Today's Notifications" },
    { key: "failed", label: "Failed" },
    { key: "pending", label: "Pending" },
    { key: "delivered", label: "Delivered" },
    { key: "read", label: "Read" }
];
async function CommunicationsPage() {
    const data = await (0, notifications_actions_1.getCommunicationDashboardDataAction)();
    return ((0, jsx_runtime_1.jsx)(admin_shell_1.AdminShell, { title: "Communication Center", description: "Monitor notifications, templates, delivery state, and retries from a single enterprise dashboard.", children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.24em] text-brand", children: "Communication Dashboard" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-2 text-xl font-semibold text-slate-950", children: "Enterprise-ready communication monitoring" })] }), (0, jsx_runtime_1.jsx)("form", { action: notifications_actions_1.retryFailedNotificationsAction, children: (0, jsx_runtime_1.jsx)("button", { className: "rounded-2xl bg-brand px-4 py-2 text-sm font-semibold text-white", type: "submit", children: "Retry All Failed" }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3", children: metricCards.map((card) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm text-slate-500", children: card.label }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-3xl font-semibold text-slate-950", children: data.stats[card.key] })] }, card.key))) }), (0, jsx_runtime_1.jsx)(communication_dashboard_1.CommunicationDashboard, { logs: data.logs, templates: data.templates })] }) }));
}

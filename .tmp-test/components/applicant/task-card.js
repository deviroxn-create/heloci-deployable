"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskCards = TaskCards;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const tasks = [
    {
        title: "Upload proof of income",
        description: "Required for housing verification.",
        status: "Pending",
        icon: lucide_react_1.FileText,
        color: "text-warning"
    },
    {
        title: "Review application response",
        description: "Staff will update you once review is complete.",
        status: "In progress",
        icon: lucide_react_1.Clock3,
        color: "text-brand"
    },
    {
        title: "Check message from case manager",
        description: "A new note is waiting in your inbox.",
        status: "Unread",
        icon: lucide_react_1.MessageSquare,
        color: "text-slate-900"
    },
    {
        title: "Confirm address details",
        description: "Review your property preference for accuracy.",
        status: "Complete",
        icon: lucide_react_1.CheckCircle2,
        color: "text-success"
    }
];
function TaskCards() {
    return ((0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 sm:grid-cols-2", children: tasks.map((task) => {
            const Icon = task.icon;
            return ((0, jsx_runtime_1.jsx)("article", { className: "rounded-[28px] border border-border bg-white p-6 shadow-soft", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-slate-50 text-slate-900", children: (0, jsx_runtime_1.jsx)(Icon, { className: "h-5 w-5" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-semibold text-slate-950", children: task.title }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-slate-600", children: task.description })] })] }), (0, jsx_runtime_1.jsx)("span", { className: `rounded-full px-3 py-1 text-sm font-semibold ${task.color}`, children: task.status })] }) }, task.title));
        }) }));
}

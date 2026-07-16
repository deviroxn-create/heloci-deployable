"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminStaffPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const admin_shell_1 = require("@/components/admin/admin-shell");
const button_1 = require("@/components/ui/button");
const add_staff_modal_1 = require("@/components/admin/add-staff-modal");
const staffMembers = [
    {
        id: "STAFF-001",
        name: "Maya Thompson",
        email: "maya.t@heloci.ngo",
        assignedCases: 12,
        resolved: 47,
        unread: 3,
        status: "Active"
    },
    {
        id: "STAFF-002",
        name: "Priya Anand",
        email: "priya.a@heloci.ngo",
        assignedCases: 9,
        resolved: 61,
        unread: 1,
        status: "Active"
    },
    {
        id: "STAFF-003",
        name: "Leon Murray",
        email: "leon.m@heloci.ngo",
        assignedCases: 14,
        resolved: 38,
        unread: 5,
        status: "Active"
    },
    {
        id: "STAFF-004",
        name: "Sofia Ramirez",
        email: "sofia.r@heloci.ngo",
        assignedCases: 0,
        resolved: 22,
        unread: 0,
        status: "On leave"
    }
];
function AdminStaffPage() {
    const [modalOpen, setModalOpen] = (0, react_1.useState)(false);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(admin_shell_1.AdminShell, { title: "Staff management", description: "View staff case loads, track performance, and manage accounts.", actions: (0, jsx_runtime_1.jsxs)(button_1.Button, { size: "sm", onClick: () => setModalOpen(true), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-4 w-4 mr-2" }), "Add staff member"] }), children: [(0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 sm:grid-cols-3", children: [
                            { label: "Total staff", value: "18" },
                            { label: "Active today", value: "14" },
                            { label: "Total open cases", value: "35" }
                        ].map((item) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[24px] border border-border bg-white px-5 py-4 text-center shadow-soft", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-slate-500", children: item.label }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-2xl font-semibold tabular-nums text-slate-950", children: item.value })] }, item.label))) }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-5 xl:grid-cols-2", children: staffMembers.map((staff) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-lg font-bold text-brand", children: staff.name.charAt(0) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "font-semibold text-slate-950", children: staff.name }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500", children: staff.email })] })] }), (0, jsx_runtime_1.jsx)("span", { className: `shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${staff.status === "Active" ? "bg-success/10 text-success" : "bg-slate-100 text-slate-500"}`, children: staff.status })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-5 grid grid-cols-3 gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl bg-slate-50 px-3 py-2.5 text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center gap-1 text-brand", children: (0, jsx_runtime_1.jsx)(lucide_react_1.ClipboardList, { className: "h-3.5 w-3.5" }) }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-lg font-semibold tabular-nums text-slate-950", children: staff.assignedCases }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500", children: "Open cases" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl bg-slate-50 px-3 py-2.5 text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center gap-1 text-success", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Users, { className: "h-3.5 w-3.5" }) }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-lg font-semibold tabular-nums text-slate-950", children: staff.resolved }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500", children: "Resolved" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl bg-slate-50 px-3 py-2.5 text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center gap-1 text-warning", children: (0, jsx_runtime_1.jsx)(lucide_react_1.MessageSquare, { className: "h-3.5 w-3.5" }) }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-lg font-semibold tabular-nums text-slate-950", children: staff.unread }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500", children: "Unread" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-5 flex gap-2 border-t border-border pt-4", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: "flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50", children: "View cases" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-brand/10 py-2 text-sm font-medium text-brand transition hover:bg-brand/20", children: "Assign case" })] })] }, staff.id))) })] }), (0, jsx_runtime_1.jsx)(add_staff_modal_1.AddStaffModal, { open: modalOpen, onClose: () => setModalOpen(false) })] }));
}

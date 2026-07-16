"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffShell = StaffShell;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const client_1 = require("@/lib/supabase/client");
const user_badge_1 = require("@/components/shared/user-badge");
const navItems = [
    { label: "Dashboard", href: "/staff/dashboard", icon: lucide_react_1.LayoutDashboard },
    { label: "Applications", href: "/staff/applications", icon: lucide_react_1.ClipboardList },
    { label: "Messages", href: "/staff/messages", icon: lucide_react_1.MessageSquare },
    { label: "Reviews", href: "/staff/reviews", icon: lucide_react_1.Star },
    { label: "Reports", href: "/staff/reports", icon: lucide_react_1.BarChart3 }
];
function StaffShell({ title, description, children, actions }) {
    const pathname = (0, navigation_1.usePathname)();
    const router = (0, navigation_1.useRouter)();
    const handleSignOut = async () => {
        await client_1.supabase.auth.signOut();
        router.push("/login");
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-surface", children: (0, jsx_runtime_1.jsxs)("div", { className: "grid lg:grid-cols-[260px_1fr]", children: [(0, jsx_runtime_1.jsxs)("aside", { className: "hidden lg:flex flex-col gap-6 min-h-screen sticky top-0 border-r border-border bg-white p-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 px-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-brand text-white text-sm font-bold", children: "H" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-bold text-slate-950", children: "Heloci" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500", children: "Staff portal" })] })] }), (0, jsx_runtime_1.jsx)("nav", { className: "flex-1 space-y-1", children: navItems.map((item) => {
                                const active = pathname === item.href;
                                const Icon = item.icon;
                                return ((0, jsx_runtime_1.jsxs)(link_1.default, { href: item.href, className: `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${active
                                        ? "bg-brand text-white shadow-sm"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`, children: [(0, jsx_runtime_1.jsx)(Icon, { className: "h-4 w-4" }), item.label] }, item.href));
                            }) }), (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: handleSignOut, className: "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.LogOut, { className: "h-4 w-4" }), "Sign out"] })] }), (0, jsx_runtime_1.jsxs)("main", { className: "min-h-screen", children: [(0, jsx_runtime_1.jsx)("div", { className: "sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur px-6 py-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-brand", children: "Staff" }), (0, jsx_runtime_1.jsx)("h1", { className: "text-xl font-semibold text-slate-950", children: title })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [actions, (0, jsx_runtime_1.jsx)(user_badge_1.UserBadge, {})] })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "p-6 space-y-6", children: [description ? ((0, jsx_runtime_1.jsx)("p", { className: "text-sm leading-7 text-slate-600 max-w-2xl", children: description })) : null, children] })] })] }) }));
}

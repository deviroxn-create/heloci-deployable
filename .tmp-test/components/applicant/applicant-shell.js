"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicantShell = ApplicantShell;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const user_badge_1 = require("@/components/shared/user-badge");
const client_1 = require("@/lib/supabase/client");
const navItems = [
    { label: "Dashboard", href: "/applicant/dashboard", icon: lucide_react_1.Home },
    { label: "Applications", href: "/applicant/applications", icon: lucide_react_1.ClipboardList },
    { label: "Documents", href: "/applicant/documents", icon: lucide_react_1.FileText },
    { label: "Messages", href: "/applicant/messages", icon: lucide_react_1.MessageSquare },
    { label: "Settings", href: "/applicant/settings", icon: lucide_react_1.Settings }
];
function ApplicantShell({ title, description, actions = [], children }) {
    const pathname = (0, navigation_1.usePathname)();
    const router = (0, navigation_1.useRouter)();
    const handleSignOut = async () => {
        await client_1.supabase.auth.signOut();
        router.push("/login");
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "grid gap-8 lg:grid-cols-[280px_1fr]", children: [(0, jsx_runtime_1.jsxs)("aside", { className: "space-y-8 rounded-[32px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-3xl bg-brand/10 p-5", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.24em] text-brand", children: "Applicant hub" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-sm leading-7 text-slate-600", children: "Track your applications, upload documents, and message staff from one calm dashboard." })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: navItems.map((item) => {
                                    const active = pathname === item.href;
                                    const Icon = item.icon;
                                    return ((0, jsx_runtime_1.jsxs)(link_1.default, { href: item.href, className: `flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition ${active ? "bg-brand/10 text-brand shadow-sm" : "text-slate-700 hover:bg-slate-50"}`, children: [(0, jsx_runtime_1.jsx)(Icon, { className: "h-5 w-5" }), item.label] }, item.href));
                                }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-slate-50 p-5", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.24em] text-slate-900", children: "Need assistance?" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-sm leading-7 text-slate-600", children: "Connect with your case manager or open the AI assistant for fast guidance." }), (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", className: "mt-4 w-full justify-center", children: "Open assistant" })] }), (0, jsx_runtime_1.jsx)("div", { className: "rounded-[28px] border border-border bg-white p-5 shadow-sm", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-slate-950", children: "Next checkpoint" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-slate-600", children: "Upload your income verification by Monday." })] }), (0, jsx_runtime_1.jsx)("span", { className: "inline-flex rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand", children: "Due soon" })] }) }), actions.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: actions.map((action) => ((0, jsx_runtime_1.jsxs)(link_1.default, { href: action.href, className: "flex items-center justify-between rounded-3xl border border-border bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-50", children: [action.label, (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "h-4 w-4 text-slate-500" })] }, action.href))) })) : null, (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[24px] border border-border bg-white p-4 flex items-center justify-between gap-3", children: [(0, jsx_runtime_1.jsx)(user_badge_1.UserBadge, {}), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: handleSignOut, className: "inline-flex items-center justify-center rounded-xl p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700", "aria-label": "Sign out", children: (0, jsx_runtime_1.jsx)(lucide_react_1.LogOut, { className: "h-4 w-4" }) })] })] }), (0, jsx_runtime_1.jsxs)("section", { className: "space-y-8", children: [(0, jsx_runtime_1.jsx)("div", { className: "rounded-[32px] bg-white p-8 shadow-soft", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.24em] text-brand", children: title }), (0, jsx_runtime_1.jsx)("h1", { className: "mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl", children: title }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 max-w-3xl text-base leading-7 text-slate-600", children: description })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-3", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { asChild: true, variant: "outline", children: (0, jsx_runtime_1.jsx)(link_1.default, { href: "/matches", children: "View eligibility" }) }), (0, jsx_runtime_1.jsx)(button_1.Button, { asChild: true, children: (0, jsx_runtime_1.jsx)(link_1.default, { href: "/matches", children: "New application" }) })] })] }) }), children] })] }));
}

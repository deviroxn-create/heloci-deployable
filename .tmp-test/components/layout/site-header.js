"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiteHeader = SiteHeader;
const jsx_runtime_1 = require("react/jsx-runtime");
const image_1 = __importDefault(require("next/image"));
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const react_1 = require("react");
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
const client_1 = require("@/lib/supabase/client");
const button_1 = require("@/components/ui/button");
const navItems = [
    { label: "Home", href: "/" },
    { label: "Find Housing", href: "/properties" },
    { label: "Eligibility Checker", href: "/eligibility" }
];
const programs = [
    { label: "Family Housing", href: "/properties?program=family" },
    { label: "Emergency Housing", href: "/properties?program=emergency" },
    { label: "Veteran Housing", href: "/properties?program=veterans" }
];
const resources = [
    { label: "FAQ", href: "/contact#faq" },
    { label: "Guides", href: "/about#guides" },
    { label: "Documents", href: "/eligibility#documents" }
];
function SiteHeader() {
    const pathname = (0, navigation_1.usePathname)();
    const router = (0, navigation_1.useRouter)();
    const [drawerOpen, setDrawerOpen] = (0, react_1.useState)(false);
    const [session, setSession] = (0, react_1.useState)(null);
    const [authLoading, setAuthLoading] = (0, react_1.useState)(true);
    // Detect auth state on mount and listen for changes
    (0, react_1.useEffect)(() => {
        client_1.supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setAuthLoading(false);
        });
        const { data: listener } = client_1.supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            setAuthLoading(false);
        });
        return () => listener.subscription.unsubscribe();
    }, []);
    const handleSignOut = async () => {
        await client_1.supabase.auth.signOut();
        setDrawerOpen(false);
        router.push("/");
    };
    const isSignedIn = !authLoading && session !== null;
    // Derive dashboard href from user metadata / session
    // We redirect to applicant by default; role-based redirect is handled by layouts
    const dashboardHref = "/applicant/dashboard";
    const userEmail = session?.user?.email ?? "";
    const userInitial = userEmail.charAt(0).toUpperCase();
    return ((0, jsx_runtime_1.jsxs)("header", { className: "sticky top-0 z-50 border-b border-white/70 bg-white/80 backdrop-blur backdrop-saturate-150 shadow-sm transition duration-300", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 md:px-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-5", children: [(0, jsx_runtime_1.jsxs)(link_1.default, { href: "/", className: "inline-flex items-center gap-3 text-lg font-semibold tracking-tight text-slate-950", children: [(0, jsx_runtime_1.jsx)(image_1.default, { src: "/heloci-logo.svg", alt: "Heloci logo", width: 40, height: 40, className: "rounded-2xl" }), "Heloci"] }), (0, jsx_runtime_1.jsxs)("nav", { className: "hidden items-center gap-1 text-sm font-medium text-slate-700 md:flex", children: [navItems.map((item) => ((0, jsx_runtime_1.jsx)(link_1.default, { href: item.href, className: `rounded-full px-4 py-2 transition hover:bg-slate-100 hover:text-brand ${pathname === item.href ? "text-brand" : "text-slate-700"}`, children: item.label }, item.href))), (0, jsx_runtime_1.jsxs)("div", { className: "group relative", children: [(0, jsx_runtime_1.jsxs)("button", { type: "button", className: "inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-brand", children: ["Programs ", (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { className: "h-4 w-4" })] }), (0, jsx_runtime_1.jsx)("div", { className: "invisible absolute left-0 top-full mt-2 w-56 rounded-3xl border border-border bg-white p-3 shadow-soft transition duration-200 group-hover:visible group-focus-within:visible", children: programs.map((item) => ((0, jsx_runtime_1.jsx)(link_1.default, { href: item.href, className: "block rounded-2xl px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50", children: item.label }, item.href))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "group relative", children: [(0, jsx_runtime_1.jsxs)("button", { type: "button", className: "inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-brand", children: ["Resources ", (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { className: "h-4 w-4" })] }), (0, jsx_runtime_1.jsx)("div", { className: "invisible absolute left-0 top-full mt-2 w-56 rounded-3xl border border-border bg-white p-3 shadow-soft transition duration-200 group-hover:visible group-focus-within:visible", children: resources.map((item) => ((0, jsx_runtime_1.jsx)(link_1.default, { href: item.href, className: "block rounded-2xl px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50", children: item.label }, item.href))) })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "hidden items-center gap-3 md:flex", children: authLoading ? (
                        // Skeleton placeholder while session loads
                        (0, jsx_runtime_1.jsx)("div", { className: "h-9 w-40 animate-pulse rounded-full bg-slate-100" })) : isSignedIn ? (
                        /* ── SIGNED IN ── */
                        (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-slate-700 transition hover:bg-slate-100", "aria-label": "Notifications", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Bell, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: dashboardHref, className: "inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.LayoutDashboard, { className: "h-4 w-4" }), "Dashboard"] }), (0, jsx_runtime_1.jsxs)("div", { className: "inline-flex items-center gap-2 rounded-full border border-border bg-white pl-1 pr-4 py-1", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white", children: userInitial }), (0, jsx_runtime_1.jsx)("span", { className: "max-w-[120px] truncate text-sm font-medium text-slate-700", children: userEmail })] }), (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: handleSignOut, className: "inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-error/40 hover:text-error", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.LogOut, { className: "h-4 w-4" }), "Sign out"] })] })) : (
                        /* ── NOT SIGNED IN ── */
                        (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(link_1.default, { href: "/login", className: "inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand", children: "Sign in" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/register", children: (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", children: "Get started" }) })] })) }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-slate-700 transition hover:bg-slate-100 md:hidden", onClick: () => setDrawerOpen(true), "aria-label": "Open menu", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Menu, { className: "h-5 w-5" }) })] }), (0, jsx_runtime_1.jsx)(framer_motion_1.AnimatePresence, { children: drawerOpen ? ((0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { className: "fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm md:hidden", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: () => setDrawerOpen(false), children: (0, jsx_runtime_1.jsxs)(framer_motion_1.motion.div, { className: "absolute right-0 top-0 h-full w-[320px] bg-white px-6 py-6 shadow-soft overflow-y-auto", initial: { x: 320 }, animate: { x: 0 }, exit: { x: 320 }, transition: { type: "spring", damping: 25, stiffness: 320 }, onClick: (e) => e.stopPropagation(), children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pb-6", children: [(0, jsx_runtime_1.jsxs)(link_1.default, { href: "/", onClick: () => setDrawerOpen(false), className: "flex items-center gap-3 text-lg font-semibold text-slate-950", children: [(0, jsx_runtime_1.jsx)(image_1.default, { src: "/heloci-logo.svg", alt: "Heloci logo", width: 36, height: 36, className: "rounded-2xl" }), "Heloci"] }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-slate-700", onClick: () => setDrawerOpen(false), "aria-label": "Close menu", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-5 w-5" }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [navItems.map((item) => ((0, jsx_runtime_1.jsx)(link_1.default, { href: item.href, className: "block rounded-2xl border border-border bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 transition hover:bg-slate-100", onClick: () => setDrawerOpen(false), children: item.label }, item.href))), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl border border-border bg-slate-50 p-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.2em] text-slate-500", children: "Programs" }), (0, jsx_runtime_1.jsx)("div", { className: "mt-3 space-y-1", children: programs.map((item) => ((0, jsx_runtime_1.jsx)(link_1.default, { href: item.href, className: "block rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-white", onClick: () => setDrawerOpen(false), children: item.label }, item.href))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl border border-border bg-slate-50 p-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.2em] text-slate-500", children: "Resources" }), (0, jsx_runtime_1.jsx)("div", { className: "mt-3 space-y-1", children: resources.map((item) => ((0, jsx_runtime_1.jsx)(link_1.default, { href: item.href, className: "block rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-white", onClick: () => setDrawerOpen(false), children: item.label }, item.href))) })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 border-t border-border pt-6 space-y-3", children: isSignedIn ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 rounded-2xl bg-brand/5 px-4 py-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white", children: userInitial }), (0, jsx_runtime_1.jsx)("p", { className: "truncate text-sm font-medium text-slate-900", children: userEmail })] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: dashboardHref, onClick: () => setDrawerOpen(false), className: "flex items-center gap-2 justify-center rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.LayoutDashboard, { className: "h-4 w-4 text-brand" }), "Go to dashboard"] }), (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: handleSignOut, className: "flex w-full items-center gap-2 justify-center rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-semibold text-error transition hover:bg-error/10", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.LogOut, { className: "h-4 w-4" }), "Sign out"] })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(link_1.default, { href: "/login", onClick: () => setDrawerOpen(false), className: "flex items-center justify-center rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50", children: "Sign in" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/register", onClick: () => setDrawerOpen(false), className: "flex items-center justify-center rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brandHover", children: "Get started" })] })) })] }) })) : null })] }));
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Page;
const jsx_runtime_1 = require("react/jsx-runtime");
const button_1 = require("@/components/ui/button");
const page_shell_1 = require("@/components/shared/page-shell");
const lucide_react_1 = require("lucide-react");
const values = [
    {
        title: "Mission-driven",
        description: "Heloci was built to connect vulnerable families with safe, supported housing options and expert NGO guidance.",
        icon: lucide_react_1.Heart
    },
    {
        title: "Trusted support",
        description: "We combine AI guidance, caseworker communication, and clear workflows so every applicant feels supported.",
        icon: lucide_react_1.ShieldCheck
    },
    {
        title: "Community impact",
        description: "Our platform is designed to reduce application friction, improve transparency, and speed help to the people who need it most.",
        icon: lucide_react_1.Users
    }
];
function Page() {
    return ((0, jsx_runtime_1.jsxs)(page_shell_1.PageShell, { children: [(0, jsx_runtime_1.jsx)("section", { className: "rounded-[32px] bg-white px-6 py-10 shadow-soft md:px-10 md:py-14", children: (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-10 lg:grid-cols-[0.95fr_0.8fr] lg:items-center", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.24em] text-brand", children: "About Heloci" }), (0, jsx_runtime_1.jsx)("h1", { className: "mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl", children: "Building housing support that feels calm, clear, and trusted." }), (0, jsx_runtime_1.jsx)("p", { className: "mt-6 max-w-2xl text-base leading-8 text-slate-600", children: "Heloci brings together verified housing listings, eligibility guidance, and NGO workflows so applicants can move forward with confidence." }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-8 flex flex-col gap-4 sm:flex-row", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { className: "min-w-[170px]", children: "Browse programs" }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", className: "min-w-[170px]", children: "Meet our team" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[32px] border border-border bg-slate-50 p-8 shadow-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] bg-white p-6 shadow-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-brand/10 text-brand", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Sparkles, { className: "h-6 w-6" }) }), (0, jsx_runtime_1.jsx)("p", { className: "mt-5 text-sm text-slate-600", children: "Our platform is built for applicants, staff, and admins working together to place people in safe homes." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-slate-50 p-5", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-slate-950", children: "Founded for impact" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-sm leading-7 text-slate-600", children: "Heloci started with the idea that housing support should be accessible, personalized, and compassionate." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-slate-50 p-5", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-slate-950", children: "Designed for clarity" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-sm leading-7 text-slate-600", children: "Every workflow is structured to reduce confusion and help applicants take the next best step." })] })] })] })] }) }), (0, jsx_runtime_1.jsx)("section", { className: "grid gap-6 lg:grid-cols-3", children: values.map((item) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[32px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-brand/10 text-brand", children: (0, jsx_runtime_1.jsx)(item.icon, { className: "h-6 w-6" }) }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-5 text-xl font-semibold text-slate-950", children: item.title }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-sm leading-7 text-slate-600", children: item.description })] }, item.title))) })] }));
}

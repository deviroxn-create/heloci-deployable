"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Page;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const button_1 = require("@/components/ui/button");
const page_shell_1 = require("@/components/shared/page-shell");
const lucide_react_1 = require("lucide-react");
const criteria = [
    {
        title: "Household qualifications",
        description: "Income limits, household size, veteran status, and local program priorities determine the right match for support.",
        icon: lucide_react_1.ShieldCheck
    },
    {
        title: "Document checklist",
        description: "Clear requirements for ID, income proofs, residency, and case notes reduce uncertainty before applying.",
        icon: lucide_react_1.FileText
    },
    {
        title: "Application timeline",
        description: "Automated updates keep you informed at every step from review to approval or follow-up requests.",
        icon: lucide_react_1.Clock3
    }
];
function Page() {
    return ((0, jsx_runtime_1.jsxs)(page_shell_1.PageShell, { children: [(0, jsx_runtime_1.jsx)("section", { className: "rounded-[32px] bg-white px-6 py-10 shadow-soft md:px-10 md:py-14", children: (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-10 lg:grid-cols-[0.95fr_0.85fr] lg:items-center", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.24em] text-brand", children: "Eligibility checker" }), (0, jsx_runtime_1.jsx)("h1", { className: "mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl", children: "Know where you stand before you apply." }), (0, jsx_runtime_1.jsx)("p", { className: "mt-6 max-w-2xl text-base leading-8 text-slate-600", children: "Heloci helps you understand which programs you qualify for, what documents are needed, and how to move forward with confidence." }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-8 flex flex-col gap-4 sm:flex-row", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { asChild: true, className: "min-w-[170px]", children: (0, jsx_runtime_1.jsx)(link_1.default, { href: "/profile", children: "Start eligibility check" }) }), (0, jsx_runtime_1.jsx)(button_1.Button, { asChild: true, variant: "outline", className: "min-w-[170px]", children: (0, jsx_runtime_1.jsx)(link_1.default, { href: "/properties", children: "Browse support programs" }) })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "rounded-[32px] border border-border bg-slate-50 p-8 shadow-sm", children: (0, jsx_runtime_1.jsx)("div", { className: "space-y-5", children: criteria.map((item) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] bg-white p-5 shadow-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 text-brand", children: [(0, jsx_runtime_1.jsx)(item.icon, { className: "h-5 w-5" }), (0, jsx_runtime_1.jsx)("p", { className: "text-base font-semibold text-slate-950", children: item.title })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-sm leading-7 text-slate-600", children: item.description })] }, item.title))) }) })] }) }), (0, jsx_runtime_1.jsx)("section", { className: "grid gap-6 lg:grid-cols-3", children: [
                    {
                        title: "Income bands",
                        details: "We display the correct threshold for your household so you can apply only where you're likely to qualify."
                    },
                    {
                        title: "Document clarity",
                        details: "Upload and track paperwork in one place so missing document requests feel simple, not stressful."
                    },
                    {
                        title: "Program matching",
                        details: "Heloci matches your profile with family housing, veteran assistance, and emergency shelter options."
                    }
                ].map((item) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[32px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold text-slate-950", children: item.title }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-sm leading-7 text-slate-600", children: item.details })] }, item.title))) })] }));
}

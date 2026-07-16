"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MatchesPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const badge_1 = require("@/components/ui/badge");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
function formatDeadline(value) {
    if (!value)
        return null;
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(value);
}
function MatchesPage() {
    const [matches, setMatches] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    async function loadMatches() {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/matches");
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.error || "Unable to load matches.");
            setMatches(data);
        }
        catch (err) {
            setError(err.message || "Unable to load matches.");
        }
        finally {
            setLoading(false);
        }
    }
    (0, react_1.useEffect)(() => {
        void loadMatches();
    }, []);
    async function refreshMatches() {
        try {
            const response = await fetch("/api/matches/refresh", { method: "POST" });
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.error || "Unable to refresh matches.");
            setMatches(data);
        }
        catch (err) {
            setError(err.message || "Unable to refresh matches.");
        }
    }
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-slate-50 px-4 py-10 text-[#2D323C]", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-6xl space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.24em] text-[#006AFF]", children: "Program matches" }), (0, jsx_runtime_1.jsx)("h1", { className: "text-4xl font-semibold text-slate-950", children: "Your best Heloci opportunities" }), (0, jsx_runtime_1.jsx)("p", { className: "max-w-2xl text-sm text-slate-600", children: "Matches are ranked from your profile, eligibility results, and pending actions." })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { onClick: () => void refreshMatches(), variant: "outline", children: "Refresh matches" })] }), loading ? ((0, jsx_runtime_1.jsx)(card_1.Card, { className: "rounded-[16px] p-8 text-slate-600", children: "Loading your matches\u2026" })) : error ? ((0, jsx_runtime_1.jsx)(card_1.Card, { className: "rounded-[16px] p-8 text-red-600", children: error })) : !matches || (matches.eligible.length === 0 && matches.nearlyEligible.length === 0 && matches.recommendedActions.length === 0) ? ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: "rounded-[16px] p-8", children: [(0, jsx_runtime_1.jsx)("p", { className: "mb-4 text-slate-700", children: "No matches yet. Complete your profile to unlock more programs." }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/profile", className: "text-sm font-semibold text-[#006AFF]", children: "Update your profile" })] })) : ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-8", children: [(0, jsx_runtime_1.jsxs)("section", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-semibold text-slate-950", children: "Your matches" }), (0, jsx_runtime_1.jsx)(badge_1.Badge, { className: "bg-emerald-100 text-emerald-700", children: "Eligible" })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-6 lg:grid-cols-2", children: matches.eligible.map((program) => ((0, jsx_runtime_1.jsx)(MatchCard, { program: program }, program.programId))) })] }), matches.nearlyEligible.length > 0 ? ((0, jsx_runtime_1.jsxs)("section", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-semibold text-slate-950", children: "Nearly eligible" }), (0, jsx_runtime_1.jsx)(badge_1.Badge, { className: "bg-amber-100 text-amber-700", children: "Almost there" })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-6 lg:grid-cols-2", children: matches.nearlyEligible.map((program) => ((0, jsx_runtime_1.jsx)(MatchCard, { program: program }, program.programId))) })] })) : null, matches.recommendedActions.length > 0 ? ((0, jsx_runtime_1.jsxs)("section", { className: "space-y-4", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-semibold text-slate-950", children: "Recommended actions" }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 lg:grid-cols-2", children: matches.recommendedActions.map((action, index) => ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: "rounded-[16px] p-6", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-lg font-semibold text-slate-950", children: action.action }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-2 text-sm text-slate-600", children: ["This unlocks: ", action.programs.join(", ")] }), action.missingFields.length > 0 ? (0, jsx_runtime_1.jsxs)("p", { className: "mt-3 text-sm font-semibold text-[#006AFF]", children: ["Missing fields: ", action.missingFields.join(", ")] }) : null, (0, jsx_runtime_1.jsx)(link_1.default, { href: "/profile?section=employment", className: "mt-4 inline-flex text-sm font-semibold text-[#006AFF]", children: "Update profile" })] }, `${action.action}-${index}`))) })] })) : null] }))] }) }));
}
function MatchCard({ program }) {
    return ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: "rounded-[16px] p-6 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-xl font-semibold text-slate-950", children: program.programName }), program.matchDescription ? (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-slate-600", children: program.matchDescription }) : null] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-2", children: [(0, jsx_runtime_1.jsxs)(badge_1.Badge, { className: program.isEligible ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700", children: ["Score: ", program.score, "/100"] }), program.needsReview ? (0, jsx_runtime_1.jsx)(badge_1.Badge, { className: "bg-slate-100 text-slate-700", children: "Manual review" }) : null, program.deadline ? (0, jsx_runtime_1.jsxs)(badge_1.Badge, { className: "bg-rose-100 text-rose-700", children: ["Deadline ", formatDeadline(program.deadline)] }) : null] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-5 space-y-3 text-sm text-slate-700", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "font-semibold text-slate-800", children: "Why you qualify" }), (0, jsx_runtime_1.jsx)("ul", { className: "mt-2 list-disc space-y-1 pl-5", children: program.matched.length > 0 ? program.matched.map((item) => (0, jsx_runtime_1.jsx)("li", { children: item }, item)) : (0, jsx_runtime_1.jsx)("li", { children: "No matched criteria returned." }) })] }), program.failed.length > 0 ? (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "font-semibold text-slate-800", children: "What you still need" }), (0, jsx_runtime_1.jsx)("ul", { className: "mt-2 list-disc space-y-1 pl-5", children: program.failed.map((item) => (0, jsx_runtime_1.jsx)("li", { children: item }, item)) })] }) : null] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 flex flex-wrap gap-3", children: (0, jsx_runtime_1.jsx)(button_1.Button, { asChild: true, className: "rounded-full bg-[#006AFF] text-white hover:bg-[#0057e6]", children: (0, jsx_runtime_1.jsx)(link_1.default, { href: program.applicationStatus === "draft" ? `/apply/${program.programSlug}` : program.applicationStatus === "submitted" ? "/dashboard" : `/apply/${program.programSlug}`, children: program.applicationStatus === "draft" ? "Continue application" : program.applicationStatus === "submitted" ? "View application" : "Start application" }) }) })] }));
}

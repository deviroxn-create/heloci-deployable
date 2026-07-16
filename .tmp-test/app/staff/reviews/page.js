"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StaffReviewsPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const staff_shell_1 = require("@/components/staff/staff-shell");
const button_1 = require("@/components/ui/button");
const reviews = [
    {
        id: "REV-001",
        applicationId: "APP-5411",
        applicant: "Carlos Reyes",
        program: "Veteran Housing",
        status: "Complete",
        recommendation: "Approve",
        note: "Applicant meets all income and residency criteria. DD-214 verified. Recommend approval for unit 2B.",
        date: "Jun 23, 2026"
    },
    {
        id: "REV-002",
        applicationId: "APP-5412",
        applicant: "Amara Singh",
        program: "Family Housing",
        status: "Pending",
        recommendation: null,
        note: "",
        date: "Jun 24, 2026"
    },
    {
        id: "REV-003",
        applicationId: "APP-5410",
        applicant: "Lena Fischer",
        program: "Emergency Shelter",
        status: "Complete",
        recommendation: "Approve",
        note: "Emergency need verified by intake team. Household size and income confirmed. Priority placement recommended.",
        date: "Jun 20, 2026"
    }
];
const recommendationStyles = {
    Approve: "bg-success/10 text-success",
    Reject: "bg-error/10 text-error",
    Waitlist: "bg-slate-100 text-slate-600"
};
function StaffReviewsPage() {
    return ((0, jsx_runtime_1.jsxs)(staff_shell_1.StaffShell, { title: "Case reviews", description: "Submit application reviews, approval notes, and follow-up tasks.", actions: (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", children: "New review" }), children: [(0, jsx_runtime_1.jsx)("div", { className: "grid gap-4 sm:grid-cols-3", children: [
                    { label: "Reviews submitted", value: "24", icon: lucide_react_1.Star },
                    { label: "Pending reviews", value: "3", icon: lucide_react_1.Clock3 },
                    { label: "Approvals recommended", value: "18", icon: lucide_react_1.CheckCircle2 }
                ].map((item) => {
                    const Icon = item.icon;
                    return ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[24px] border border-border bg-white px-5 py-4 text-center shadow-soft", children: [(0, jsx_runtime_1.jsx)(Icon, { className: "mx-auto h-5 w-5 text-brand" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-2xl font-semibold tabular-nums text-slate-950", children: item.value }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500", children: item.label })] }, item.label));
                }) }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-5", children: reviews.map((review) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-lg font-bold text-brand", children: review.applicant.charAt(0) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 flex-wrap", children: [(0, jsx_runtime_1.jsx)("p", { className: "font-semibold text-slate-950", children: review.applicant }), (0, jsx_runtime_1.jsx)("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-semibold ${review.status === "Complete" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`, children: review.status }), review.recommendation ? ((0, jsx_runtime_1.jsx)("span", { className: `rounded-full px-2.5 py-0.5 text-xs font-semibold ${recommendationStyles[review.recommendation]}`, children: review.recommendation })) : null] }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-slate-500", children: [review.id, " \u00B7 ", review.applicationId, " \u00B7 ", review.program] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-400", children: review.date })] })] }) }), review.status === "Complete" && review.note ? ((0, jsx_runtime_1.jsxs)("div", { className: "mt-4 rounded-2xl bg-slate-50 px-4 py-3", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold text-slate-500 mb-1.5", children: "Review notes" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm leading-6 text-slate-700", children: review.note })] })) : null, review.status === "Pending" ? ((0, jsx_runtime_1.jsxs)("div", { className: "mt-4 space-y-3", children: [(0, jsx_runtime_1.jsx)("textarea", { rows: 3, placeholder: "Add review notes for this case\u2026", className: "w-full resize-none rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20", "aria-label": "Review notes" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs font-semibold text-slate-500 self-center", children: "Recommend:" }), (0, jsx_runtime_1.jsxs)("button", { type: "button", className: "rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success transition hover:bg-success/20", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "inline h-3.5 w-3.5 mr-1" }), "Approve"] }), (0, jsx_runtime_1.jsxs)("button", { type: "button", className: "rounded-full bg-error/10 px-3 py-1.5 text-xs font-semibold text-error transition hover:bg-error/20", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.XCircle, { className: "inline h-3.5 w-3.5 mr-1" }), "Reject"] }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200", children: "Waitlist" })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { size: "sm", children: "Submit review" })] })) : null] }, review.id))) })] }));
}

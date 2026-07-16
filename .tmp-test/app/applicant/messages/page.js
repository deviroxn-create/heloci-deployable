"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Page;
const jsx_runtime_1 = require("react/jsx-runtime");
const applicant_shell_1 = require("@/components/applicant/applicant-shell");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
const conversations = [
    {
        id: "MSG-001",
        from: "Case manager",
        preview: "Please upload your most recent pay stub so we can finish verification.",
        time: "1h ago",
        unread: true
    },
    {
        id: "MSG-002",
        from: "Heloci support",
        preview: "Your veteran housing application has been approved. Next steps are scheduling a move-in call.",
        time: "2 days ago",
        unread: false
    }
];
function Page() {
    return ((0, jsx_runtime_1.jsx)(applicant_shell_1.ApplicantShell, { title: "Messages", description: "Keep your support conversations organized and respond quickly to staff requests.", children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-8", children: [(0, jsx_runtime_1.jsxs)("section", { className: "rounded-[32px] bg-white p-8 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm uppercase tracking-[0.24em] text-brand", children: "Inbox" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-3 text-2xl font-semibold text-slate-950", children: "Latest messages" })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", children: "Compose message" })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-8 space-y-4", children: conversations.map((conversation) => ((0, jsx_runtime_1.jsx)("div", { className: `rounded-[28px] border ${conversation.unread ? "border-brand/20 bg-brand/10" : "border-border bg-slate-50"} p-5`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-slate-950", children: conversation.from }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm leading-7 text-slate-600", children: conversation.preview })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-right text-sm text-slate-500", children: [(0, jsx_runtime_1.jsx)("p", { children: conversation.time }), conversation.unread ? (0, jsx_runtime_1.jsx)("span", { className: "mt-2 inline-flex rounded-full bg-brand/10 px-2 py-1 text-xs font-semibold text-brand", children: "Unread" }) : null] })] }) }, conversation.id))) })] }), (0, jsx_runtime_1.jsxs)("section", { className: "rounded-[32px] bg-slate-50 p-8 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 text-brand", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MessageSquare, { className: "h-5 w-5" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm uppercase tracking-[0.24em]", children: "Communication tips" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 grid gap-4 sm:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] bg-white p-5", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-slate-950", children: "Respond quickly" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-sm leading-7 text-slate-600", children: "Answer staff questions within 24 hours to keep your review on schedule." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] bg-white p-5", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-slate-950", children: "Share details clearly" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-sm leading-7 text-slate-600", children: "Include program name or document name in replies so your case manager can support you faster." })] })] })] })] }) }));
}

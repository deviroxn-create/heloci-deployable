"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Page;
const jsx_runtime_1 = require("react/jsx-runtime");
const button_1 = require("@/components/ui/button");
const page_shell_1 = require("@/components/shared/page-shell");
const lucide_react_1 = require("lucide-react");
function Page() {
    return ((0, jsx_runtime_1.jsxs)(page_shell_1.PageShell, { children: [(0, jsx_runtime_1.jsx)("section", { className: "rounded-[32px] bg-white px-6 py-10 shadow-soft md:px-10 md:py-14", children: (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-10 lg:grid-cols-[0.95fr_0.8fr] lg:items-center", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.24em] text-brand", children: "Contact support" }), (0, jsx_runtime_1.jsx)("h1", { className: "mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl", children: "Help is always within reach." }), (0, jsx_runtime_1.jsx)("p", { className: "mt-6 max-w-2xl text-base leading-8 text-slate-600", children: "Reach Heloci staff for questions about properties, applications, documentation, or eligibility. Our team is here to guide you every step of the way." }), (0, jsx_runtime_1.jsx)(button_1.Button, { className: "mt-8 min-w-[170px]", children: "Send a message" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-6 rounded-[32px] border border-border bg-slate-50 p-8 shadow-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] bg-white p-6 shadow-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 text-brand", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: "h-5 w-5" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.24em] text-slate-950", children: "Email" })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-sm leading-7 text-slate-600", children: "support@heloci.ngo" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] bg-white p-6 shadow-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 text-brand", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Phone, { className: "h-5 w-5" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.24em] text-slate-950", children: "Phone" })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-sm leading-7 text-slate-600", children: "(555) 123-4567" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] bg-white p-6 shadow-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 text-brand", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MessageSquare, { className: "h-5 w-5" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.24em] text-slate-950", children: "Visit help center" })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-sm leading-7 text-slate-600", children: "Access FAQs, application guides, and program resources anytime." })] })] })] }) }), (0, jsx_runtime_1.jsx)("section", { className: "grid gap-6 lg:grid-cols-3", children: [
                    {
                        title: "Quick support",
                        detail: "Every inquiry is prioritized so applicants and staff get timely guidance when it matters most."
                    },
                    {
                        title: "Staff assistance",
                        detail: "Trained NGO workers review your case and help you prepare a complete application package."
                    },
                    {
                        title: "Program clarity",
                        detail: "We help you understand eligibility, required documents, and next steps before you submit anything."
                    }
                ].map((item) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[32px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold text-slate-950", children: item.title }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-sm leading-7 text-slate-600", children: item.detail })] }, item.title))) })] }));
}

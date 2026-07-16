"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Page;
const jsx_runtime_1 = require("react/jsx-runtime");
const applicant_shell_1 = require("@/components/applicant/applicant-shell");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
const documents = [
    { label: "Proof of income", status: "Pending", icon: lucide_react_1.FileText },
    { label: "Household roster", status: "Uploaded", icon: lucide_react_1.UploadCloud },
    { label: "Photo ID", status: "Verified", icon: lucide_react_1.CheckCircle2 },
    { label: "Residency proof", status: "Rejected", icon: lucide_react_1.AlertTriangle }
];
function Page() {
    return ((0, jsx_runtime_1.jsx)(applicant_shell_1.ApplicantShell, { title: "Documents", description: "Keep your required paperwork organized so your application moves forward without delays.", children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-8", children: [(0, jsx_runtime_1.jsxs)("section", { className: "rounded-[32px] bg-white p-8 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm uppercase tracking-[0.24em] text-brand", children: "Document upload" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-3 text-2xl font-semibold text-slate-950", children: "Complete your application checklist." })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { children: "Upload files" })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-8 grid gap-4", children: documents.map((document) => {
                                const Icon = document.icon;
                                const statusStyles = {
                                    Pending: "bg-warning/10 text-warning",
                                    Uploaded: "bg-brand/10 text-brand",
                                    Verified: "bg-success/10 text-success",
                                    Rejected: "bg-error/10 text-error"
                                };
                                return ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-4 rounded-[28px] border border-border bg-slate-50 p-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-white text-slate-900 shadow-sm", children: (0, jsx_runtime_1.jsx)(Icon, { className: "h-5 w-5" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "font-semibold text-slate-950", children: document.label }), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-slate-600", children: ["Status: ", document.status] })] })] }), (0, jsx_runtime_1.jsx)("span", { className: `rounded-full px-3 py-1 text-sm font-semibold ${statusStyles[document.status]}`, children: document.status })] }, document.label));
                            }) })] }), (0, jsx_runtime_1.jsxs)("section", { className: "rounded-[32px] bg-slate-50 p-8 shadow-soft", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm uppercase tracking-[0.24em] text-brand", children: "How it works" }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 grid gap-4 sm:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] bg-white p-5", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-slate-950", children: "Accepted file types" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-sm leading-7 text-slate-600", children: "PDF, JPG, PNG, DOCX. Keep uploads under 12MB per file." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] bg-white p-5", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-slate-950", children: "What happens next" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-sm leading-7 text-slate-600", children: "Staff reviews uploads within 24 hours and sends any follow-up requests directly to your inbox." })] })] })] })] }) }));
}

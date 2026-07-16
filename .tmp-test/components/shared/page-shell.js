"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageShell = PageShell;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const site_header_1 = require("@/components/layout/site-header");
const site_footer_1 = require("@/components/layout/site-footer");
const assistant_panel_1 = require("@/components/ai/assistant-panel");
function PageShell({ title, children }) {
    const [assistantOpen, setAssistantOpen] = (0, react_1.useState)(false);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-surface text-slate-900", children: [(0, jsx_runtime_1.jsx)(site_header_1.SiteHeader, {}), (0, jsx_runtime_1.jsxs)("main", { className: "mx-auto max-w-[1440px] px-4 py-6 md:px-8", children: [title ? ((0, jsx_runtime_1.jsx)("header", { className: "mb-10", children: (0, jsx_runtime_1.jsx)("h1", { className: "text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl", children: title }) })) : null, (0, jsx_runtime_1.jsx)("section", { className: "space-y-10", children: children })] }), (0, jsx_runtime_1.jsx)(site_footer_1.SiteFooter, {}), (0, jsx_runtime_1.jsxs)("div", { className: "fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3", children: [assistantOpen ? ((0, jsx_runtime_1.jsxs)("div", { className: "w-full max-w-[360px] rounded-[32px] border border-border bg-white p-4 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-slate-950", children: "AI Chat" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500", children: "Ask Heloci for eligibility help or housing support." })] }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-slate-700 transition hover:bg-slate-100", onClick: () => setAssistantOpen(false), "aria-label": "Close chat panel", children: "\u00D7" })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-4", children: (0, jsx_runtime_1.jsx)(assistant_panel_1.AssistantPanel, {}) })] })) : null, (0, jsx_runtime_1.jsx)("button", { type: "button", className: "inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/20 transition hover:bg-blue-600", onClick: () => setAssistantOpen((current) => !current), "aria-label": "Open AI chat", children: (0, jsx_runtime_1.jsx)(lucide_react_1.MessageSquare, { className: "h-6 w-6" }) })] })] }));
}

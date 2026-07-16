"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaceholderPage = PlaceholderPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const card_1 = require("@/components/ui/card");
const page_shell_1 = require("@/components/shared/page-shell");
const lucide_react_1 = require("lucide-react");
function PlaceholderPage({ title, description, highlights = [], actions = [], children }) {
    return ((0, jsx_runtime_1.jsx)(page_shell_1.PageShell, { title: title, children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-8", children: [(0, jsx_runtime_1.jsx)(card_1.Card, { className: "overflow-hidden border-0 bg-gradient-to-br from-brand/5 via-surface to-white p-8 shadow-overlay", children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 rounded-full bg-brand/5 px-4 py-2 text-sm font-semibold text-brand", children: [(0, jsx_runtime_1.jsx)("span", { className: "inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-brand text-white", children: "H" }), "Production-ready scaffold"] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-3xl font-semibold tracking-tight text-slate-950", children: title }), (0, jsx_runtime_1.jsx)("p", { className: "max-w-3xl text-base leading-7 text-slate-600", children: description })] }), highlights.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "grid gap-3 sm:grid-cols-2", children: highlights.map((item) => ((0, jsx_runtime_1.jsx)("div", { className: "rounded-3xl border border-border bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm", children: item }, item))) })) : null] }) }), children, actions.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "grid gap-3 sm:grid-cols-2", children: actions.map((action) => ((0, jsx_runtime_1.jsxs)(link_1.default, { href: action.href, className: `inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${action.primary ? "bg-brand text-white hover:bg-brandHover" : "border border-border bg-white text-slate-950 hover:bg-slate-50"}`, children: [action.label, action.primary ? (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "ml-2 h-4 w-4" }) : null] }, action.href))) })) : null] }) }));
}

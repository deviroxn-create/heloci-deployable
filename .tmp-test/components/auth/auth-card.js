"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthCard = AuthCard;
const jsx_runtime_1 = require("react/jsx-runtime");
function AuthCard({ heading, description, children }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "overflow-hidden rounded-[24px] bg-white p-10 shadow-card", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.28em] text-brand", children: "Secure & welcoming" }), (0, jsx_runtime_1.jsx)("h1", { className: "text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl", children: heading }), (0, jsx_runtime_1.jsx)("p", { className: "max-w-xl text-sm leading-6 text-slate-600", children: description })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-8", children: children })] }));
}

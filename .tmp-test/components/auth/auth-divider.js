"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthDivider = AuthDivider;
const jsx_runtime_1 = require("react/jsx-runtime");
function AuthDivider({ label }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "relative my-6 text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute inset-x-0 top-1/2 h-px bg-slate-200" }), (0, jsx_runtime_1.jsx)("span", { className: "relative inline-flex bg-white px-4 text-sm text-slate-500", children: label })] }));
}

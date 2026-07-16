"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = Card;
exports.CardHeader = CardHeader;
exports.CardTitle = CardTitle;
exports.CardContent = CardContent;
exports.CardFooter = CardFooter;
const jsx_runtime_1 = require("react/jsx-runtime");
function Card({ children, className = "" }) {
    return (0, jsx_runtime_1.jsx)("div", { className: `rounded-3xl border border-border bg-white p-6 shadow-card ${className}`, children: children });
}
function CardHeader({ children, className = "" }) {
    return (0, jsx_runtime_1.jsx)("div", { className: `mb-4 flex flex-wrap items-start justify-between gap-4 ${className}`, children: children });
}
function CardTitle({ children, className = "" }) {
    return (0, jsx_runtime_1.jsx)("h2", { className: `text-xl font-semibold ${className}`, children: children });
}
function CardContent({ children, className = "" }) {
    return (0, jsx_runtime_1.jsx)("div", { className: `text-sm leading-7 text-slate-600 ${className}`, children: children });
}
function CardFooter({ children, className = "" }) {
    return (0, jsx_runtime_1.jsx)("div", { className: `mt-4 ${className}`, children: children });
}

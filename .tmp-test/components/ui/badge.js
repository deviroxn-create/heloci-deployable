"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Badge = Badge;
const jsx_runtime_1 = require("react/jsx-runtime");
const clsx_1 = __importDefault(require("clsx"));
function Badge({ children, className = "" }) {
    return ((0, jsx_runtime_1.jsx)("span", { className: (0, clsx_1.default)("inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700", className), children: children }));
}

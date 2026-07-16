"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = Button;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const clsx_1 = __importDefault(require("clsx"));
const variantStyles = {
    primary: "bg-brand text-white shadow-soft hover:bg-brandHover focus-visible:ring-brand/30",
    secondary: "bg-slate-950 text-white hover:bg-slate-800 focus-visible:ring-slate-300",
    outline: "border border-border bg-white text-slate-950 hover:bg-slate-50 focus-visible:ring-brand/20",
    ghost: "bg-transparent text-slate-950 hover:bg-slate-100 focus-visible:ring-brand/20"
};
const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-3 text-sm"
};
function Button({ children, className = "", variant = "primary", size = "md", asChild = false, ...props }) {
    const classes = (0, clsx_1.default)("inline-flex items-center justify-center rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface", variantStyles[variant], sizeStyles[size], className);
    if (asChild && (0, react_1.isValidElement)(children)) {
        return (0, react_1.cloneElement)(children, {
            className: (0, clsx_1.default)(children.props.className, classes),
            ...props
        });
    }
    return ((0, jsx_runtime_1.jsx)("button", { className: classes, ...props, children: children }));
}

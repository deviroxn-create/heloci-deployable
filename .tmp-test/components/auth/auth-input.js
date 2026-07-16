"use strict";
"use client";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthInput = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const input_1 = require("@/components/ui/input");
const clsx_1 = __importDefault(require("clsx"));
exports.AuthInput = React.forwardRef(({ label, helperText, error, icon: Icon, type = "text", className = "", ...props }, ref) => {
    const [visible, setVisible] = (0, react_1.useState)(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (visible ? "text" : "password") : type;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between text-sm font-medium text-slate-900", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: props.id || props.name, children: label }), helperText ? (0, jsx_runtime_1.jsx)("span", { className: "text-slate-500", children: helperText }) : null] }), (0, jsx_runtime_1.jsxs)("div", { className: (0, clsx_1.default)("relative", error ? "ring-1 ring-error/40" : ""), children: [Icon ? ((0, jsx_runtime_1.jsx)("span", { className: "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400", children: (0, jsx_runtime_1.jsx)(Icon, { className: "h-5 w-5" }) })) : null, (0, jsx_runtime_1.jsx)(input_1.Input, { ref: ref, type: inputType, className: (0, clsx_1.default)("h-14 rounded-[16px] border border-border bg-white px-4 py-3 text-sm text-slate-950 placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/15", Icon ? "pl-12" : "px-4", isPassword ? "pr-20" : "pr-4", className), ...props }), isPassword ? ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setVisible((current) => !current), className: "absolute right-4 top-1/2 -translate-y-1/2 inline-flex h-9 items-center justify-center rounded-full bg-surface px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100", children: visible ? (0, jsx_runtime_1.jsx)(lucide_react_1.EyeOff, { className: "h-4 w-4" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { className: "h-4 w-4" }) })) : null] }), error ? (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-error", children: error }) : null] }));
});
exports.AuthInput.displayName = "AuthInput";

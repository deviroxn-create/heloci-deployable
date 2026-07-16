"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityIndicators = SecurityIndicators;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const indicators = [
    {
        label: "Secure authentication",
        description: "Your sign-in is protected with industry-standard encryption.",
        icon: lucide_react_1.ShieldCheck
    },
    {
        label: "Encrypted connection",
        description: "Data is transmitted over a secure SSL connection.",
        icon: lucide_react_1.Lock
    },
    {
        label: "Privacy protected",
        description: "Heloci keeps your information safe and private.",
        icon: lucide_react_1.Shield
    }
];
function SecurityIndicators() {
    return ((0, jsx_runtime_1.jsx)("div", { className: "mt-10 grid gap-3 sm:grid-cols-3", children: indicators.map((item) => {
            const Icon = item.icon;
            return ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[20px] border border-slate-200 bg-white/90 p-4 shadow-sm", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand", children: (0, jsx_runtime_1.jsx)(Icon, { className: "h-5 w-5" }) }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-sm font-semibold text-slate-950", children: item.label }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm leading-6 text-slate-600", children: item.description })] }, item.label));
        }) }));
}

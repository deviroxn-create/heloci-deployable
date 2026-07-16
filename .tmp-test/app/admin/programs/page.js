"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminProgramsPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
function AdminProgramsPage() {
    const router = (0, navigation_1.useRouter)();
    const [programs, setPrograms] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        void (async () => {
            try {
                const response = await fetch("/api/admin/programs");
                const result = await response.json();
                if (!response.ok)
                    throw new Error(result.error || "Unable to load programs.");
                setPrograms(Array.isArray(result) ? result : []);
            }
            catch (err) {
                setError(err.message || "Unable to load programs.");
            }
            finally {
                setLoading(false);
            }
        })();
    }, []);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-semibold", children: "Programs" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-slate-600", children: "Create and manage eligibility programs for your organization." })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { onClick: () => router.push("/admin/programs/new"), children: "Create Program" })] }), loading ? (0, jsx_runtime_1.jsx)(card_1.Card, { className: "p-6", children: "Loading\u2026" }) : error ? (0, jsx_runtime_1.jsx)(card_1.Card, { className: "p-6 text-red-600", children: error }) : null, (0, jsx_runtime_1.jsx)("div", { className: "grid gap-4", children: programs.map((program) => ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: "flex items-center justify-between p-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-semibold", children: program.name }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-slate-600", children: program.description || "No description" })] }), (0, jsx_runtime_1.jsx)(link_1.default, { href: `/admin/programs/${program.id}/rules`, className: "text-sm font-semibold text-[#006AFF]", children: "Edit Rules" })] }, program.id))) })] }));
}

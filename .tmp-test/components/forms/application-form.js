"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationForm = ApplicationForm;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_hook_form_1 = require("react-hook-form");
const zod_1 = require("@hookform/resolvers/zod");
const schemas_1 = require("@/lib/validations/schemas");
function ApplicationForm() {
    const { register, handleSubmit, formState: { errors } } = (0, react_hook_form_1.useForm)({ resolver: (0, zod_1.zodResolver)(schemas_1.applicationSchema) });
    const onSubmit = (data) => {
        console.log("submit", data);
    };
    return ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-5", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-slate-700", children: "Monthly income" }), (0, jsx_runtime_1.jsx)("input", { type: "number", ...register("income", { valueAsNumber: true }), className: "mt-2 w-full rounded-3xl border border-border bg-surface px-4 py-3" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-xs text-red-500", children: errors.income?.message })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-slate-700", children: "Household size" }), (0, jsx_runtime_1.jsx)("input", { type: "number", ...register("householdSize", { valueAsNumber: true }), className: "mt-2 w-full rounded-3xl border border-border bg-surface px-4 py-3" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-xs text-red-500", children: errors.householdSize?.message })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-slate-700", children: "Additional notes" }), (0, jsx_runtime_1.jsx)("textarea", { ...register("notes"), className: "mt-2 w-full rounded-3xl border border-border bg-surface px-4 py-3", rows: 4 })] }), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700", children: "Submit Application" })] }));
}

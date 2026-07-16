"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProgramRulesPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
function ProgramRulesPage() {
    const params = (0, navigation_1.useParams)();
    const [rules, _setRules] = (0, react_1.useState)({ and: [] });
    const [name, setName] = (0, react_1.useState)("v1");
    const [preview, setPreview] = (0, react_1.useState)([]);
    const [result, setResult] = (0, react_1.useState)("Not tested yet");
    const sampleProfile = (0, react_1.useMemo)(() => ({
        employment: { status: "teacher" },
        income: { monthly: 3000 }
    }), []);
    async function handleSave() {
        const response = await fetch(`/api/admin/programs/${params.id}/rules`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rules, name })
        });
        const data = await response.json();
        if (!response.ok) {
            setResult(data.error || "Unable to save");
            return;
        }
        setResult(`Saved rule version ${data.version}`);
    }
    (0, react_1.useEffect)(() => {
        setPreview(["If employment status equals Teacher AND monthly income >= 2000"]);
    }, []);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-semibold", children: "Edit Rules" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-slate-600", children: "Build JSON Logic-based eligibility rules without writing code." })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "p-6 space-y-4", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "rule-name", className: "block text-sm font-medium", children: "Rule name" }), (0, jsx_runtime_1.jsx)("input", { id: "rule-name", value: name, onChange: (event) => setName(event.target.value), className: "w-full rounded border border-slate-300 px-3 py-2" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded border border-slate-200 p-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "mb-3 text-sm font-semibold", children: "Profile fields" }), (0, jsx_runtime_1.jsxs)("ul", { className: "space-y-2 text-sm text-slate-600", children: [(0, jsx_runtime_1.jsx)("li", { children: "personal.age" }), (0, jsx_runtime_1.jsx)("li", { children: "income.monthly" }), (0, jsx_runtime_1.jsx)("li", { children: "employment.status" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded border border-slate-200 p-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "mb-3 text-sm font-semibold", children: "Operators" }), (0, jsx_runtime_1.jsxs)("ul", { className: "space-y-2 text-sm text-slate-600", children: [(0, jsx_runtime_1.jsx)("li", { children: "equals" }), (0, jsx_runtime_1.jsx)("li", { children: "greater than" }), (0, jsx_runtime_1.jsx)("li", { children: "in list" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded border border-slate-200 p-4", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "rule-value", className: "mb-3 block text-sm font-semibold", children: "Values" }), (0, jsx_runtime_1.jsx)("input", { id: "rule-value", className: "w-full rounded border border-slate-300 px-3 py-2", defaultValue: "teacher" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded border border-slate-200 bg-slate-50 p-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold", children: "Preview" }), (0, jsx_runtime_1.jsx)("ul", { className: "mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600", children: preview.map((line) => (0, jsx_runtime_1.jsx)("li", { children: line }, line)) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-3", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { onClick: () => setResult(`Test result: ${JSON.stringify(sampleProfile)}`), children: "Test Rule" }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", onClick: handleSave, children: "Save Rule" })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-slate-600", children: result })] })] }));
}

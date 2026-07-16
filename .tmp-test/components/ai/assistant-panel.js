"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssistantPanel = AssistantPanel;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
function AssistantPanel() {
    const [question, setQuestion] = (0, react_1.useState)("");
    const [answer, setAnswer] = (0, react_1.useState)("");
    const handleAsk = async () => {
        setAnswer("Generating guidance...");
        setAnswer("This is a placeholder for the Heloci AI assistant.");
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-3xl border border-border bg-white p-6 shadow-card", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-semibold text-slate-950", children: "AI Assistant" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-slate-600", children: "Ask about eligibility, documents, or housing guidance." }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-4 space-y-3", children: [(0, jsx_runtime_1.jsx)("textarea", { value: question, onChange: (event) => setQuestion(event.target.value), placeholder: "Ask your Heloci assistant\u2026", className: "w-full rounded-3xl border border-border bg-surface px-4 py-3", rows: 3 }), (0, jsx_runtime_1.jsx)("button", { onClick: handleAsk, className: "rounded-full bg-brand px-5 py-3 text-white hover:bg-blue-700", children: "Ask Heloci" })] }), answer && (0, jsx_runtime_1.jsx)("div", { className: "mt-5 rounded-3xl bg-surface p-4 text-sm text-slate-700", children: answer })] }));
}

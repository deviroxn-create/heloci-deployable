"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProgramQuestionsPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
function ProgramQuestionsPage() {
    const [pages, setPages] = (0, react_1.useState)([{ id: "page-1", title: "About you", questions: [] }]);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-semibold", children: "Dynamic form builder" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-slate-600", children: "Create pages and questions that render for any active program." })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { children: "Publish Question Set" })] }), pages.map((page) => ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: "p-6 space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-semibold", children: page.title }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", children: "Add Question" })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-slate-600", children: "Questions and conditions can be stored through the Prisma-backed schema for each program." })] }, page.id))), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", onClick: () => setPages((value) => [...value, { id: `page-${value.length + 1}`, title: `Page ${value.length + 1}`, questions: [] }]), children: "Add Page" })] }));
}

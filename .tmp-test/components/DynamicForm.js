"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DynamicForm;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const react_hook_form_1 = require("react-hook-form");
const zod_1 = require("@hookform/resolvers/zod");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const validator_1 = require("@/lib/forms/validator");
function DynamicForm({ pages, applicationId, initialPage = 0, onComplete }) {
    const router = (0, navigation_1.useRouter)();
    const [pageIndex, setPageIndex] = (0, react_1.useState)(initialPage);
    const [submitting, setSubmitting] = (0, react_1.useState)(false);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [message, setMessage] = (0, react_1.useState)(null);
    const currentPage = pages[pageIndex];
    const schema = (0, react_1.useMemo)(() => (0, validator_1.buildZodSchema)(currentPage?.questions ?? []), [currentPage]);
    const form = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(schema),
        defaultValues: Object.fromEntries((currentPage?.questions ?? []).map((question) => [question.key, question.value ?? ""]))
    });
    (0, react_1.useEffect)(() => {
        form.reset(Object.fromEntries((currentPage?.questions ?? []).map((question) => [question.key, question.value ?? ""])));
    }, [currentPage, form]);
    async function saveDraft(values) {
        setSaving(true);
        setMessage(null);
        try {
            await fetch(`/api/applications/${applicationId}/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pageData: values, currentPage: pageIndex + 1 })
            });
        }
        finally {
            setSaving(false);
        }
    }
    async function handleNext(values) {
        await saveDraft(values);
        if (pageIndex < pages.length - 1) {
            setPageIndex((value) => value + 1);
            return;
        }
        setSubmitting(true);
        try {
            const response = await fetch(`/api/applications/${applicationId}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: values })
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Unable to submit application.");
            }
            onComplete?.();
            router.push("/dashboard");
        }
        catch (error) {
            setMessage(error.message);
        }
        finally {
            setSubmitting(false);
        }
    }
    if (!currentPage) {
        return (0, jsx_runtime_1.jsx)("div", { className: "text-sm text-slate-600", children: "No questions available for this program yet." });
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between text-sm text-slate-600", children: [(0, jsx_runtime_1.jsxs)("span", { children: ["Step ", pageIndex + 1, " of ", pages.length] }), (0, jsx_runtime_1.jsxs)("span", { children: [Math.round(((pageIndex + 1) / pages.length) * 100), "%"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "h-2 w-full rounded-full bg-slate-200", children: (0, jsx_runtime_1.jsx)("div", { className: "h-2 rounded-full bg-[#006AFF]", style: { width: `${((pageIndex + 1) / pages.length) * 100}%` } }) })] }), (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "p-6", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold text-slate-900", children: currentPage.title }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: form.handleSubmit(handleNext), className: "mt-6 space-y-4", children: [currentPage.questions.map((question) => ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: question.key, className: "text-sm font-medium text-slate-800", children: question.label }), question.helpText ? (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-slate-500", children: question.helpText }) : null, question.type === "select" ? ((0, jsx_runtime_1.jsxs)("select", { id: question.key, ...form.register(question.key), className: "w-full rounded-3xl border border-border bg-white px-4 py-3 text-slate-900", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select an option" }), question.options?.map((option) => (0, jsx_runtime_1.jsx)("option", { value: option.value, children: option.label }, option.value))] })) : question.type === "textarea" ? ((0, jsx_runtime_1.jsx)("textarea", { id: question.key, ...form.register(question.key), className: "min-h-24 w-full rounded-3xl border border-border bg-white px-4 py-3" })) : question.type === "number" ? ((0, jsx_runtime_1.jsx)(input_1.Input, { id: question.key, type: "number", ...form.register(question.key) })) : question.type === "boolean" ? ((0, jsx_runtime_1.jsx)("input", { id: question.key, type: "checkbox", ...form.register(question.key), className: "h-4 w-4 rounded border-slate-300" })) : question.type === "date" ? ((0, jsx_runtime_1.jsx)(input_1.Input, { id: question.key, type: "date", ...form.register(question.key) })) : question.type === "file" ? ((0, jsx_runtime_1.jsx)(input_1.Input, { id: question.key, type: "file", ...form.register(question.key) })) : ((0, jsx_runtime_1.jsx)(input_1.Input, { id: question.key, type: "text", ...form.register(question.key) })), form.formState.errors[question.key] ? (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-red-600", children: form.formState.errors[question.key]?.message }) : null] }, question.id))), message ? (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-red-600", children: message }) : null, (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-3 pt-2", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "outline", onClick: () => setPageIndex((value) => Math.max(0, value - 1)), disabled: pageIndex === 0, children: "Back" }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", disabled: submitting || saving, className: "bg-[#006AFF] text-white hover:bg-[#0057e6]", children: pageIndex === pages.length - 1 ? (submitting ? "Submitting…" : "Submit Application") : (saving ? "Saving…" : "Continue") })] })] })] })] }));
}

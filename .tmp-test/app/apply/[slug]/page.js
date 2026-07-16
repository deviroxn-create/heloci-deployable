"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ApplyPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const DynamicForm_1 = __importDefault(require("@/components/DynamicForm"));
const card_1 = require("@/components/ui/card");
function ApplyPage() {
    const router = (0, navigation_1.useRouter)();
    const params = (0, navigation_1.useParams)();
    const [data, setData] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        async function loadForm() {
            setLoading(true);
            setError(null);
            const response = await fetch(`/api/programs/${params.slug}/form`);
            const result = await response.json();
            if (!response.ok) {
                setError(result.error || "Unable to load this form.");
                setLoading(false);
                return;
            }
            setData(result);
            setLoading(false);
        }
        if (params.slug) {
            loadForm();
        }
    }, [params.slug]);
    if (loading) {
        return (0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-slate-50 px-4 py-10 text-slate-700", children: "Loading form\u2026" });
    }
    if (error) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-slate-50 px-4 py-10 text-[#2D323C]", children: (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "mx-auto max-w-3xl p-8", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-semibold", children: "We could not load this application" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-sm text-slate-600", children: error }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "mt-6 text-sm font-semibold text-[#006AFF]", onClick: () => router.push("/matches"), children: "Return to matches" })] }) }));
    }
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-slate-50 px-4 py-10 text-[#2D323C]", children: (0, jsx_runtime_1.jsx)("div", { className: "mx-auto max-w-4xl", children: (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "rounded-[16px] p-8 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.24em] text-[#006AFF]", children: "Program application" }), (0, jsx_runtime_1.jsx)("h1", { className: "text-3xl font-semibold text-slate-950", children: data?.programName }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-sm leading-7 text-slate-600", children: "Complete the questions below to submit your application." })] }), data ? (0, jsx_runtime_1.jsx)(DynamicForm_1.default, { pages: data.pages, applicationId: data.applicationId, initialPage: data.currentPage, onComplete: () => router.push("/dashboard") }) : null] }) }) }));
}

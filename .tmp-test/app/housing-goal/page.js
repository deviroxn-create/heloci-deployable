"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HousingGoalPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const image_1 = __importDefault(require("next/image"));
const navigation_1 = require("next/navigation");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const goals = [
    { label: "Rent a home", value: "rent" },
    { label: "Buy a home", value: "buy" },
    { label: "Rent-to-Own", value: "rent_to_own" },
    { label: "Emergency housing", value: "emergency" },
    { label: "Teacher Housing", value: "assistance" },
    { label: "Not sure", value: "explore" }
];
function HousingGoalPage() {
    const router = (0, navigation_1.useRouter)();
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-slate-50 px-4 py-10 text-slate-900", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-5xl", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-10 flex flex-col items-center text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "mb-6 h-20 w-64", children: (0, jsx_runtime_1.jsx)(image_1.default, { src: "/heloci-logo-lockup.svg", alt: "Heloci logo", width: 256, height: 80, className: "mx-auto" }) }), (0, jsx_runtime_1.jsx)("h1", { className: "text-4xl font-semibold text-[#2D323C]", children: "Find the right housing path" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 max-w-2xl text-base text-slate-600", children: "Choose a goal to help Heloci personalize your eligibility profile and match you with the best programs." })] }), (0, jsx_runtime_1.jsx)(card_1.Card, { className: "grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3", children: goals.map((goal) => ((0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", className: "w-full rounded-3xl border-[#006AFF] bg-white text-[#2D323C] hover:bg-[#E8F0FF]", onClick: () => router.push(`/profile?goal=${goal.value}`), children: goal.label }, goal.value))) })] }) }));
}

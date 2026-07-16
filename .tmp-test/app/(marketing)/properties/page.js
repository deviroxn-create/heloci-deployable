"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Page;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const button_1 = require("@/components/ui/button");
const page_shell_1 = require("@/components/shared/page-shell");
const property_card_1 = require("@/components/property/property-card");
const lucide_react_1 = require("lucide-react");
const sampleProperties = [
    {
        id: "marketing-1",
        title: "Willow Creek Family Unit",
        description: "Verified housing for families with access to supportive community services.",
        address: "34 Willow St",
        city: "Portland",
        state: "OR",
        zip: "97209",
        latitude: 45.5244,
        longitude: -122.6699,
        rent: 760,
        bedrooms: 2,
        bathrooms: 1,
        sqft: 860,
        amenities: ["Transit near", "Caseworker support", "Community kitchen"],
        specialOffers: ["Supportive services included"],
        availabilityCount: 1,
        status: "Available",
        units: [{ id: "marketing-1-unit", beds: 2, price: 760, available: true }],
        images: []
    },
    {
        id: "marketing-2",
        title: "Horizon Supportive Home",
        description: "Private apartments with eligibility guidance and secure application support.",
        address: "118 Harbor Blvd",
        city: "Seattle",
        state: "WA",
        zip: "98101",
        latitude: 47.6062,
        longitude: -122.3321,
        rent: 820,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1040,
        amenities: ["School access", "Medical shuttle", "Job referrals"],
        specialOffers: ["Flexible move-in support"],
        availabilityCount: 1,
        status: "Available",
        units: [{ id: "marketing-2-unit", beds: 3, price: 820, available: true }],
        images: []
    },
    {
        id: "marketing-3",
        title: "Oak Grove Transitional Housing",
        description: "Short-term housing with fast approval decisions and document checklists.",
        address: "221 Oak Grove Rd",
        city: "Austin",
        state: "TX",
        zip: "78701",
        latitude: 30.2672,
        longitude: -97.7431,
        rent: 690,
        bedrooms: 1,
        bathrooms: 1,
        sqft: 720,
        amenities: ["Veteran support", "Mental health resources", "Transit access"],
        specialOffers: ["Rapid approval support"],
        availabilityCount: 1,
        status: "Available",
        units: [{ id: "marketing-3-unit", beds: 1, price: 690, available: true }],
        images: []
    }
];
function Page() {
    return ((0, jsx_runtime_1.jsxs)(page_shell_1.PageShell, { children: [(0, jsx_runtime_1.jsx)("section", { className: "rounded-[32px] bg-white px-6 py-10 shadow-soft md:px-10 md:py-14", children: (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-8 lg:grid-cols-[0.95fr_0.8fr] lg:items-center", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.24em] text-brand", children: "Available housing" }), (0, jsx_runtime_1.jsx)("h1", { className: "mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl", children: "Supportive homes you can apply for today." }), (0, jsx_runtime_1.jsx)("p", { className: "mt-6 max-w-2xl text-base leading-8 text-slate-600", children: "Browse verified properties designed for families, veterans, and individuals seeking managed housing support with NGO-guided applications." }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-8 flex flex-col gap-4 sm:flex-row", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { asChild: true, className: "min-w-[170px]", children: (0, jsx_runtime_1.jsx)(link_1.default, { href: "#featured-listings", children: "Explore listings" }) }), (0, jsx_runtime_1.jsx)(button_1.Button, { asChild: true, variant: "outline", className: "min-w-[170px]", children: (0, jsx_runtime_1.jsx)(link_1.default, { href: "/eligibility", children: "Check eligibility" }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 rounded-[32px] bg-brand/10 p-6 text-slate-950 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] bg-white p-5 shadow-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 text-brand", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MapPin, { className: "h-5 w-5" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.24em]", children: "Neighborhood insights" })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-sm text-slate-600", children: "Find homes close to schools, transit, clinics, and trusted services tailored to your support needs." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] bg-white p-5 shadow-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 text-brand", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldCheck, { className: "h-5 w-5" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.24em]", children: "Verified support" })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-sm text-slate-600", children: "Every listing is reviewed for safety and program compliance before it reaches your search results." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] bg-white p-5 shadow-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 text-brand", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Heart, { className: "h-5 w-5" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.24em]", children: "Applicant-first design" })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-sm text-slate-600", children: "We keep the experience calm, clear, and easy so families can focus on getting support faster." })] })] })] }) }), (0, jsx_runtime_1.jsxs)("section", { id: "featured-listings", className: "rounded-[32px] bg-slate-50 p-6 shadow-soft md:p-10", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.24em] text-brand", children: "Featured properties" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-3 text-3xl font-semibold text-slate-950", children: "Homes ready for supportive occupancy." })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", children: "View all homes" })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-8 grid gap-6 lg:grid-cols-3", children: sampleProperties.map((property) => ((0, jsx_runtime_1.jsx)(property_card_1.PropertyCard, { property: property }, property.id))) })] })] }));
}

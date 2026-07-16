"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HomePage;
const jsx_runtime_1 = require("react/jsx-runtime");
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
const page_shell_1 = require("@/components/shared/page-shell");
const property_card_1 = require("@/components/property/property-card");
const button_1 = require("@/components/ui/button");
const featured = [
    {
        id: "demo-property-1",
        title: "Cedar Grove Supportive Home",
        description: "Two-bedroom apartment near transit and case worker service centers.",
        address: "120 Central Ave",
        city: "Portland",
        state: "OR",
        zip: "97209",
        latitude: 45.5231,
        longitude: -122.6765,
        rent: 720,
        bedrooms: 2,
        bathrooms: 1,
        sqft: 840,
        amenities: ["Transit access", "Community kitchen", "Service coordination"],
        specialOffers: ["Case worker coordination"],
        availabilityCount: 1,
        status: "Available",
        units: [{ id: "demo-property-1-unit", beds: 2, price: 720, available: true }],
        images: []
    },
    {
        id: "demo-property-2",
        title: "Harborview Family Residence",
        description: "Safe, affordable units with on-site support and family readiness services.",
        address: "438 Harbor Blvd",
        city: "Seattle",
        state: "WA",
        zip: "98101",
        latitude: 47.6062,
        longitude: -122.3321,
        rent: 850,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1100,
        amenities: ["School access", "Medical shuttle", "Case manager support"],
        specialOffers: ["Family readiness support"],
        availabilityCount: 1,
        status: "Available",
        units: [{ id: "demo-property-2-unit", beds: 3, price: 850, available: true }],
        images: []
    },
    {
        id: "demo-property-3",
        title: "Willow Lane Transitional Unit",
        description: "One-bedroom apartment for veterans with medical and employment referral support.",
        address: "781 Willow Ln",
        city: "Austin",
        state: "TX",
        zip: "78701",
        latitude: 30.2672,
        longitude: -97.7431,
        rent: 680,
        bedrooms: 1,
        bathrooms: 1,
        sqft: 680,
        amenities: ["Vet services", "Counseling support", "Nearby transit"],
        specialOffers: ["Veteran referral support"],
        availabilityCount: 1,
        status: "Available",
        units: [{ id: "demo-property-3-unit", beds: 1, price: 680, available: true }],
        images: []
    }
];
const steps = [
    {
        title: "Search housing",
        description: "Explore verified properties with supportive services, safety ratings, and local neighborhood insights.",
        icon: lucide_react_1.Home
    },
    {
        title: "Check eligibility",
        description: "Answer a few questions to see what programs you qualify for and what documents are required.",
        icon: lucide_react_1.FileText
    },
    {
        title: "Apply securely",
        description: "Submit your application, upload paperwork, and track approvals through a guided workflow.",
        icon: lucide_react_1.ShieldCheck
    }
];
const testimonials = [
    {
        name: "Maya R.",
        role: "Single mother, program applicant",
        quote: "Heloci made a stressful process feel manageable. I found a safe apartment with support and knew exactly what documents to submit.",
        rating: 5
    },
    {
        name: "Jorge T.",
        role: "Veteran applicant",
        quote: "The eligibility checker gave me confidence. Staff reached out quickly, and the AI assistant helped me understand every step.",
        rating: 5
    },
    {
        name: "Aisha L.",
        role: "Family support caseworker",
        quote: "The platform keeps applications organized and gives families a calm, clear process from first search to approval.",
        rating: 5
    }
];
const faqs = [
    {
        question: "Who qualifies for Heloci housing support?",
        answer: "Applicants who meet local income guidelines, household eligibility, and priority criteria can apply. Heloci helps identify programs that match your family size, veteran status, or emergency need."
    },
    {
        question: "What documents are required to apply?",
        answer: "Common documents include ID, income verification, household roster, and residency proof. The application wizard shows exactly what is needed for your program."
    },
    {
        question: "How long does approval take?",
        answer: "Approval timelines vary by program, but Heloci keeps you informed with automated updates and staff messages so you know when the next decision is coming."
    }
];
function HomePage() {
    return ((0, jsx_runtime_1.jsxs)(page_shell_1.PageShell, { children: [(0, jsx_runtime_1.jsx)("section", { className: "overflow-hidden rounded-[32px] bg-white px-6 py-10 shadow-soft md:px-10 md:py-14", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[1.25fr_0.9fr] lg:items-center", children: [(0, jsx_runtime_1.jsxs)(framer_motion_1.motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, children: [(0, jsx_runtime_1.jsx)("p", { className: "inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-brand", children: "Trusted housing assistance" }), (0, jsx_runtime_1.jsx)("h1", { className: "mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl", children: "Find safe, affordable housing with confidence." }), (0, jsx_runtime_1.jsx)("p", { className: "mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg", children: "Search verified housing opportunities, check eligibility, and apply with confidence using Heloci\u2019s AI-powered assistance and NGO support network." }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-8 flex flex-col gap-4 sm:flex-row", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { asChild: true, className: "min-w-[170px]", size: "md", children: (0, jsx_runtime_1.jsx)(link_1.default, { href: "/properties", children: "Search Homes" }) }), (0, jsx_runtime_1.jsx)(button_1.Button, { asChild: true, variant: "outline", className: "min-w-[170px]", size: "md", children: (0, jsx_runtime_1.jsx)(link_1.default, { href: "/eligibility", children: "Check Eligibility" }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-10 grid gap-4 sm:grid-cols-3", children: [
                                        { label: "Verified Listings", icon: lucide_react_1.ShieldCheck },
                                        { label: "Secure Applications", icon: lucide_react_1.Sparkles },
                                        { label: "AI Guidance", icon: lucide_react_1.MessageSquare }
                                    ].map((item) => ((0, jsx_runtime_1.jsx)("div", { className: "rounded-3xl border border-border bg-slate-50 px-5 py-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 text-slate-900", children: [(0, jsx_runtime_1.jsx)(item.icon, { className: "h-5 w-5 text-brand" }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm font-semibold", children: item.label })] }) }, item.label))) })] }), (0, jsx_runtime_1.jsxs)(framer_motion_1.motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: 0.1 }, className: "relative", children: [(0, jsx_runtime_1.jsx)("div", { className: "pointer-events-none absolute inset-0 rounded-[32px] bg-gradient-to-br from-brand/10 via-transparent to-white opacity-70" }), (0, jsx_runtime_1.jsx)("div", { className: "relative overflow-hidden rounded-[32px] border border-border bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 shadow-soft", children: (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-[24px] bg-white p-5 shadow-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm uppercase tracking-[0.24em] text-slate-400", children: "Active case" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-2 text-xl font-semibold text-slate-950", children: "Family housing near schools" })] }), (0, jsx_runtime_1.jsx)("span", { className: "inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-success", children: "Approved" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 grid gap-3 sm:grid-cols-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "rounded-3xl bg-brand/5 px-4 py-3 text-sm text-slate-700", children: "3 beds" }), (0, jsx_runtime_1.jsx)("div", { className: "rounded-3xl bg-brand/5 px-4 py-3 text-sm text-slate-700", children: "1.2 miles to transit" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[24px] bg-slate-950 p-5 text-white shadow-soft", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm uppercase tracking-[0.24em] text-slate-400", children: "AI assistant preview" }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-4 space-y-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "rounded-3xl bg-slate-900 px-4 py-4", children: (0, jsx_runtime_1.jsx)("p", { className: "text-sm leading-7 text-slate-200", children: "\u201CWhat documents will I need for emergency housing support?\u201D" }) }), (0, jsx_runtime_1.jsx)("div", { className: "rounded-3xl bg-slate-800 px-4 py-4", children: (0, jsx_runtime_1.jsx)("p", { className: "text-sm leading-7 text-slate-200", children: "\u201CShow me verified properties under $900 near schools.\u201D" }) })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "rounded-[24px] bg-white p-5 shadow-sm", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 text-slate-700", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-10 w-10 items-center justify-center rounded-3xl bg-brand/10 text-brand", children: (0, jsx_runtime_1.jsx)(lucide_react_1.MapPin, { className: "h-5 w-5" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm uppercase tracking-[0.24em]", children: "Nearby services" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-base font-semibold text-slate-950", children: "Schools, transit, clinics" })] })] }) })] }) })] })] }) }), (0, jsx_runtime_1.jsxs)(framer_motion_1.motion.section, { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.3 }, transition: { duration: 0.5 }, className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-3 md:flex-row md:items-end md:justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.24em] text-brand", children: "Featured homes" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-3 text-3xl font-semibold text-slate-950", children: "Safe homes ready for support." })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", className: "w-full sm:w-auto", children: "View all listings" })] }), (0, jsx_runtime_1.jsx)("div", { className: "no-scrollbar grid auto-cols-[minmax(320px,1fr)] grid-flow-col gap-5 overflow-x-auto pb-2 sm:grid-cols-1 md:grid-flow-row md:grid-cols-3", children: featured.map((property) => ((0, jsx_runtime_1.jsx)(property_card_1.PropertyCard, { property: property }, property.id))) })] }), (0, jsx_runtime_1.jsxs)(framer_motion_1.motion.section, { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.3 }, transition: { duration: 0.5, delay: 0.1 }, className: "grid gap-8 lg:grid-cols-[0.95fr_0.9fr]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-[32px] bg-white p-8 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 text-brand", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex h-11 w-11 items-center justify-center rounded-3xl bg-brand/10", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Users, { className: "h-5 w-5" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm uppercase tracking-[0.24em]", children: "How Heloci works" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-3 text-3xl font-semibold text-slate-950", children: "A guided housing workflow for every applicant." })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-8 grid gap-4 sm:grid-cols-3", children: steps.map((step, index) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-slate-50 p-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-white text-brand shadow-sm", children: (0, jsx_runtime_1.jsx)(step.icon, { className: "h-5 w-5" }) }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-5 text-sm font-semibold text-slate-950", children: ["Step ", index + 1] }), (0, jsx_runtime_1.jsx)("h3", { className: "mt-3 text-xl font-semibold text-slate-950", children: step.title }), (0, jsx_runtime_1.jsx)("p", { className: "mt-3 text-sm leading-7 text-slate-600", children: step.description })] }, step.title))) })] }), (0, jsx_runtime_1.jsx)("div", { className: "rounded-[32px] bg-gradient-to-br from-brand/10 via-white to-slate-50 p-8 shadow-soft", children: (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-6 shadow-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm uppercase tracking-[0.24em] text-slate-500", children: "AI eligibility assistant" }), (0, jsx_runtime_1.jsx)("h3", { className: "mt-3 text-2xl font-semibold text-slate-950", children: "Get quick answers before you apply." })] }), (0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-brand text-white", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Sparkles, { className: "h-5 w-5" }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 space-y-4", children: [
                                        "Am I eligible for family housing?",
                                        "What documents do I need?",
                                        "Find housing near schools."
                                    ].map((prompt) => ((0, jsx_runtime_1.jsx)("div", { className: "rounded-3xl border border-border bg-slate-50 px-4 py-4 text-sm text-slate-700", children: prompt }, prompt))) }), (0, jsx_runtime_1.jsx)(button_1.Button, { className: "mt-6 w-full", children: "Try AI assistant" })] }) })] }), (0, jsx_runtime_1.jsxs)(framer_motion_1.motion.section, { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.3 }, transition: { duration: 0.5, delay: 0.2 }, className: "rounded-[32px] bg-white p-8 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "md:flex md:items-center md:justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold uppercase tracking-[0.24em] text-brand", children: "Location intelligence" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-3 text-3xl font-semibold text-slate-950", children: "See supportive services near every property." })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "outline", className: "mt-6 md:mt-0", children: "Explore map view" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-[420px] rounded-[28px] bg-slate-950/5 p-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "h-full rounded-[28px] bg-[radial-gradient(circle_at_top,_rgba(0,61,184,0.15),transparent_40%),linear-gradient(180deg,_#ffffff_0%,_#f8faff_100%)] p-6 text-slate-900", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between text-sm text-slate-600", children: [(0, jsx_runtime_1.jsx)("span", { children: "Portland, OR" }), (0, jsx_runtime_1.jsx)("span", { children: "6 listings" })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 h-full rounded-[24px] bg-slate-100 shadow-inner" })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-4", children: [
                                    "Schools",
                                    "Transit",
                                    "Hospitals",
                                    "Grocery access"
                                ].map((label) => ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-slate-50 px-5 py-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-slate-950", children: label }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-slate-600", children: "Trusted neighborhood services appear on every map summary." })] }, label))) })] })] }), (0, jsx_runtime_1.jsx)(framer_motion_1.motion.section, { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.3 }, transition: { duration: 0.5, delay: 0.3 }, className: "grid gap-6 lg:grid-cols-3", children: testimonials.map((testimonial) => ((0, jsx_runtime_1.jsxs)("article", { className: "rounded-[32px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-lg font-semibold text-slate-950", children: testimonial.name }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-slate-500", children: testimonial.role })] }), (0, jsx_runtime_1.jsxs)("div", { className: "inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Star, { className: "h-4 w-4" }), " ", testimonial.rating, ".0"] })] }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-5 text-sm leading-7 text-slate-600", children: ["\u201C", testimonial.quote, "\u201D"] })] }, testimonial.name))) }), (0, jsx_runtime_1.jsxs)(framer_motion_1.motion.section, { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.3 }, transition: { duration: 0.5, delay: 0.4 }, className: "grid gap-8 lg:grid-cols-[1.1fr_0.9fr]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-[32px] bg-white p-8 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 text-brand", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-brand/10", children: (0, jsx_runtime_1.jsx)(lucide_react_1.MessageSquare, { className: "h-5 w-5" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm uppercase tracking-[0.24em]", children: "FAQ" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-3 text-3xl font-semibold text-slate-950", children: "Questions families ask most." })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-8 space-y-4", children: faqs.map((item) => ((0, jsx_runtime_1.jsxs)("details", { className: "group rounded-[28px] border border-border bg-slate-50 p-5 transition hover:border-brand", children: [(0, jsx_runtime_1.jsx)("summary", { className: "cursor-pointer text-base font-semibold text-slate-950 list-none marker:hidden", children: item.question }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-sm leading-7 text-slate-600", children: item.answer })] }, item.question))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[32px] bg-brand text-white p-10 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-white/15 text-white", children: (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "h-5 w-5" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm uppercase tracking-[0.24em] text-white/80", children: "Need help finding housing?" }), (0, jsx_runtime_1.jsx)("h3", { className: "mt-3 text-3xl font-semibold", children: "Start your application with guided support." })] })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-5 max-w-md text-sm leading-7 text-white/80", children: "Heloci coordinates your application, documents, and staff communication so you never feel alone in the process." }), (0, jsx_runtime_1.jsx)(button_1.Button, { className: "mt-8 w-full bg-white text-brand hover:bg-slate-100", children: "Start Application" })] })] })] }));
}

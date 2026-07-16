"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProfilePage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_hook_form_1 = require("react-hook-form");
const navigation_1 = require("next/navigation");
const client_1 = require("@/lib/supabase/client");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const applicant_profile_service_1 = require("@/services/applicant-profile.service");
function normalizeQuestionOptions(options) {
    if (Array.isArray(options)) {
        return options
            .filter((option) => Boolean(option) && typeof option === "object")
            .map((option) => ({
            value: String(option.value ?? ""),
            label: String(option.label ?? option.value ?? "")
        }))
            .filter((option) => option.value);
    }
    if (typeof options === "string") {
        try {
            const parsed = JSON.parse(options);
            return parsed
                .map((option) => ({
                value: String(option.value ?? ""),
                label: String(option.label ?? option.value ?? "")
            }))
                .filter((option) => option.value);
        }
        catch {
            return [];
        }
    }
    return [];
}
function ProfilePageContent() {
    const router = (0, navigation_1.useRouter)();
    const searchParams = (0, navigation_1.useSearchParams)();
    const [questions, setQuestions] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [goal, setGoal] = (0, react_1.useState)("");
    const [profileSummary, setProfileSummary] = (0, react_1.useState)(null);
    const { register, handleSubmit, reset } = (0, react_hook_form_1.useForm)();
    (0, react_1.useEffect)(() => {
        setGoal(searchParams.get("goal") ?? "");
    }, [searchParams]);
    (0, react_1.useEffect)(() => {
        const fetchQuestions = async () => {
            setLoading(true);
            setError(null);
            const { data: { user }, error: authError } = await client_1.supabase.auth.getUser();
            if (authError) {
                setError(authError.message);
                setLoading(false);
                return;
            }
            if (!user) {
                router.replace("/login");
                return;
            }
            const { data, error: fetchError } = await client_1.supabase
                .from("questions")
                .select("id,key,label,type,options")
                .eq("is_universal", true)
                .order("key", { ascending: true });
            if (fetchError) {
                setError(fetchError.message);
                setLoading(false);
                return;
            }
            const normalizedQuestions = (data ?? []).map((item) => ({
                id: item.id,
                key: item.key,
                label: item.label,
                type: item.type,
                options: normalizeQuestionOptions(item.options)
            }));
            setQuestions(normalizedQuestions);
            try {
                const profile = await (0, applicant_profile_service_1.loadApplicantProfile)(user.id);
                const legacyPayload = Object.fromEntries(Object.entries(profile).flatMap(([section, value]) => {
                    if (value && typeof value === "object" && !Array.isArray(value)) {
                        return Object.entries(value).map(([key, nestedValue]) => [`${section}.${key}`, nestedValue]);
                    }
                    return [];
                }));
                reset(legacyPayload);
            }
            catch {
                // Fall back to the existing form state if loading from the consolidated service fails.
            }
            try {
                const response = await fetch("/api/applicant-profile", { method: "GET" });
                if (response.ok) {
                    const payload = await response.json();
                    setProfileSummary(payload.completeness ?? null);
                }
            }
            catch {
                // Ignore summary load errors and keep the existing flow working.
            }
            setLoading(false);
        };
        fetchQuestions();
    }, [reset, router]);
    const onSubmit = async (values) => {
        setSaving(true);
        setError(null);
        const { data: { user }, error: authError } = await client_1.supabase.auth.getUser();
        if (authError || !user) {
            router.replace("/login");
            setSaving(false);
            return;
        }
        try {
            const response = await fetch("/api/applicant-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    personal: {
                        fullName: typeof values.full_name === "string" ? values.full_name : undefined,
                        phone: typeof values.phone === "string" ? values.phone : undefined
                    },
                    preferences: {
                        housingGoal: goal || undefined,
                        preferredLocations: []
                    },
                    meta: {
                        lastUpdatedAt: new Date().toISOString(),
                        version: 1
                    }
                })
            });
            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                throw new Error(payload?.error || "Unable to save your structured profile.");
            }
            router.push("/matches");
        }
        catch (err) {
            setError(err.message || "Unable to save your profile.");
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-slate-50 px-4 py-10", children: (0, jsx_runtime_1.jsx)("div", { className: "mx-auto max-w-3xl text-center text-slate-700", children: "Loading your profile questions\u2026" }) }));
    }
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-slate-50 px-4 py-10 text-[#2D323C]", children: (0, jsx_runtime_1.jsx)("div", { className: "mx-auto max-w-3xl", children: (0, jsx_runtime_1.jsxs)(card_1.Card, { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-3xl font-semibold", children: "Complete your Heloci profile" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-slate-600", children: "Answer a few universal questions to determine your housing eligibility and build your reusable applicant profile." }), profileSummary ? ((0, jsx_runtime_1.jsxs)("div", { className: "mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700", children: [(0, jsx_runtime_1.jsxs)("p", { className: "font-semibold", children: ["Profile progress: ", profileSummary.score, "%"] }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-1", children: ["Status: ", profileSummary.status] })] })) : null] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-6", children: [questions.map((question) => ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: question.key, className: "block text-sm font-medium text-[#2D323C]", children: question.label }), question.type === "select" ? ((0, jsx_runtime_1.jsxs)("select", { id: question.key, ...register(question.key), className: "w-full rounded-3xl border border-border bg-white px-4 py-3 text-slate-900 outline-none", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select an option" }), question.options?.map((option) => ((0, jsx_runtime_1.jsx)("option", { value: option.value, children: option.label }, option.value)))] })) : ((0, jsx_runtime_1.jsx)(input_1.Input, { id: question.key, type: question.type === "number" ? "number" : "text", ...register(question.key, {
                                            setValueAs: (value) => {
                                                if (question.type === "number") {
                                                    return value === "" ? null : Number(value);
                                                }
                                                return value;
                                            }
                                        }) }))] }, question.id))), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-slate-600", children: ["Goal: ", goal || "Not selected"] }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", disabled: saving || loading, className: "rounded-3xl bg-[#006AFF] text-white hover:bg-[#0057e6]", children: saving ? "Saving…" : "Save profile" })] }), error ? (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-red-600", children: error }) : null] })] }) }) }));
}
function ProfilePage() {
    return ((0, jsx_runtime_1.jsx)(react_1.Suspense, { fallback: (0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-slate-50 px-4 py-10", children: (0, jsx_runtime_1.jsx)("div", { className: "mx-auto max-w-3xl text-center text-slate-700", children: "Loading your profile\u2026" }) }), children: (0, jsx_runtime_1.jsx)(ProfilePageContent, {}) }));
}

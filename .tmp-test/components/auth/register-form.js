"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterForm = RegisterForm;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const react_hook_form_1 = require("react-hook-form");
const zod_1 = require("@hookform/resolvers/zod");
const auth_input_1 = require("@/components/auth/auth-input");
const button_1 = require("@/components/ui/button");
const schemas_1 = require("@/lib/validations/schemas");
const client_1 = require("@/lib/supabase/client");
const auth_actions_1 = require("@/actions/auth.actions");
function RegisterForm() {
    const [error, setError] = (0, react_1.useState)(null);
    const [success, setSuccess] = (0, react_1.useState)(false);
    const [busy, setBusy] = (0, react_1.useState)(false);
    const { register, handleSubmit, formState: { errors } } = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(schemas_1.registerSchema)
    });
    const onSubmit = async (values) => {
        setError(null);
        setBusy(true);
        // 1. Create the Supabase auth user
        const { data, error: authError } = await client_1.supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: {
                data: { full_name: values.fullName },
                emailRedirectTo: `${window.location.origin}/login`
            }
        });
        if (authError) {
            setBusy(false);
            setError(authError.message);
            return;
        }
        // 2. Create the Prisma user record (server action)
        const result = await (0, auth_actions_1.registerUser)({
            email: values.email,
            name: values.fullName
        });
        if (!result.success) {
            setBusy(false);
            setError(result.error ?? "Failed to create account. Please try again.");
            return;
        }
        // 3. If email confirmation is disabled, session is live — go straight to dashboard
        if (data.session) {
            window.location.href = "/applicant/dashboard";
            return;
        }
        // 4. Email confirmation required
        setBusy(false);
        setSuccess(true);
    };
    if (success) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-4 rounded-[16px] border border-green-200 bg-green-50 px-6 py-8 text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-lg font-semibold text-green-800", children: "Check your email" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-green-700", children: "We've sent a confirmation link to your inbox. Click it to activate your account, then sign in." }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/login", className: "mt-4 inline-block text-sm font-semibold text-brand transition hover:text-brandHover", children: "Go to Sign In \u2192" })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsx)(auth_input_1.AuthInput, { label: "Full name", type: "text", autoComplete: "name", icon: lucide_react_1.User, ...register("fullName"), error: errors.fullName?.message }), (0, jsx_runtime_1.jsx)(auth_input_1.AuthInput, { label: "Email", type: "email", autoComplete: "email", icon: lucide_react_1.Mail, ...register("email"), error: errors.email?.message }), (0, jsx_runtime_1.jsx)(auth_input_1.AuthInput, { label: "Password", type: "password", autoComplete: "new-password", icon: lucide_react_1.Lock, ...register("password"), error: errors.password?.message }), (0, jsx_runtime_1.jsx)(auth_input_1.AuthInput, { label: "Confirm password", type: "password", autoComplete: "new-password", icon: lucide_react_1.Lock, ...register("confirmPassword"), error: errors.confirmPassword?.message })] }), error ? ((0, jsx_runtime_1.jsx)("p", { className: "rounded-[16px] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error", children: error })) : null, (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", disabled: busy, className: "h-14 w-full rounded-[16px] text-base font-semibold", children: busy ? "Creating account..." : "Create Account" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-center text-sm text-slate-600", children: ["Already have an account?", " ", (0, jsx_runtime_1.jsx)(link_1.default, { href: "/login", className: "font-semibold text-brand transition hover:text-brandHover", children: "Sign in" })] })] }));
}

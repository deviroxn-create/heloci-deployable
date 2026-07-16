"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginForm = LoginForm;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const react_hook_form_1 = require("react-hook-form");
const zod_1 = require("@hookform/resolvers/zod");
const schemas_1 = require("@/lib/validations/schemas");
const auth_input_1 = require("@/components/auth/auth-input");
const social_auth_buttons_1 = require("@/components/auth/social-auth-buttons");
const auth_divider_1 = require("@/components/auth/auth-divider");
const button_1 = require("@/components/ui/button");
const client_1 = require("@/lib/supabase/client");
function LoginForm() {
    const [error, setError] = (0, react_1.useState)(null);
    const [needsConfirmation, setNeedsConfirmation] = (0, react_1.useState)(false);
    const [resendEmail, setResendEmail] = (0, react_1.useState)("");
    const [resendBusy, setResendBusy] = (0, react_1.useState)(false);
    const [resendSent, setResendSent] = (0, react_1.useState)(false);
    const [busy, setBusy] = (0, react_1.useState)(false);
    const [rememberMe, setRememberMe] = (0, react_1.useState)(true);
    const [redirectTo, setRedirectTo] = (0, react_1.useState)("/applicant/dashboard");
    (0, react_1.useEffect)(() => {
        if (typeof window === "undefined")
            return;
        const params = new URLSearchParams(window.location.search);
        setRedirectTo(params.get("redirectTo") ?? "/applicant/dashboard");
    }, []);
    const { register, handleSubmit, formState: { errors } } = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(schemas_1.authSchema)
    });
    const onSubmit = async (values) => {
        setError(null);
        setBusy(true);
        const { error } = await client_1.supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password
        });
        if (error) {
            setBusy(false);
            // Supabase returns "Invalid login credentials" both for wrong password
            // AND for unconfirmed email. Give the user an actionable message.
            if (error.message.toLowerCase().includes("invalid login") ||
                error.message.toLowerCase().includes("invalid credentials") ||
                error.message.toLowerCase().includes("email not confirmed")) {
                setNeedsConfirmation(true);
                setResendEmail(values.email);
                setError("Sign in failed. If you just registered, please check your inbox for a confirmation link first.");
            }
            else {
                setError(error.message);
            }
            return;
        }
        // Hard navigation — ensures cookies are fully committed before the
        // next request hits the middleware (router.push is too fast)
        window.location.href = redirectTo;
    };
    return ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-6", children: [(0, jsx_runtime_1.jsx)(social_auth_buttons_1.SocialAuthButtons, { onError: setError }), (0, jsx_runtime_1.jsx)(auth_divider_1.AuthDivider, { label: "Or continue with email" }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsx)(auth_input_1.AuthInput, { label: "Email", type: "email", autoComplete: "email", icon: lucide_react_1.Mail, ...register("email"), error: errors.email?.message }), (0, jsx_runtime_1.jsx)(auth_input_1.AuthInput, { label: "Password", type: "password", autoComplete: "current-password", icon: lucide_react_1.Lock, ...register("password"), error: errors.password?.message })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [(0, jsx_runtime_1.jsxs)("label", { className: "inline-flex items-center gap-3 text-sm text-slate-700", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: rememberMe, onChange: (event) => setRememberMe(event.target.checked), className: "h-4 w-4 rounded border border-slate-300 text-brand focus:ring-brand" }), "Remember me"] }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/forgot-password", className: "text-sm font-semibold text-brand transition hover:text-brandHover", children: "Forgot password?" })] }), error ? ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-[16px] border border-error/20 bg-error/10 px-4 py-3 space-y-3", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm text-error", children: error }), needsConfirmation && (resendSent ? ((0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-success", children: "Confirmation email resent \u2014 check your inbox." })) : ((0, jsx_runtime_1.jsx)("button", { type: "button", disabled: resendBusy, onClick: async () => {
                            setResendBusy(true);
                            await client_1.supabase.auth.resend({ type: "signup", email: resendEmail });
                            setResendBusy(false);
                            setResendSent(true);
                        }, className: "text-sm font-semibold text-brand hover:underline disabled:opacity-50", children: resendBusy ? "Sending..." : "Resend confirmation email →" })))] })) : null, (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", disabled: busy, className: "h-14 w-full rounded-[16px] text-base font-semibold", children: busy ? "Signing in..." : "Sign In" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-center text-sm text-slate-600", children: ["Don't have an account?", " ", (0, jsx_runtime_1.jsx)(link_1.default, { href: "/register", className: "font-semibold text-brand transition hover:text-brandHover", children: "Create one" })] })] }));
}

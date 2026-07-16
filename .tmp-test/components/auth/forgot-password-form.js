"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForgotPasswordForm = ForgotPasswordForm;
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
function ForgotPasswordForm() {
    const [error, setError] = (0, react_1.useState)(null);
    const [success, setSuccess] = (0, react_1.useState)(null);
    const [busy, setBusy] = (0, react_1.useState)(false);
    const { register, handleSubmit, formState: { errors } } = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(schemas_1.passwordResetSchema)
    });
    const onSubmit = async (values) => {
        setError(null);
        setSuccess(null);
        setBusy(true);
        const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/login` : "/login";
        const { error } = await client_1.supabase.auth.resetPasswordForEmail(values.email, { redirectTo });
        setBusy(false);
        if (error) {
            setError(error.message);
            return;
        }
        setSuccess("Check your inbox for password reset instructions.");
    };
    return ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-6", children: [(0, jsx_runtime_1.jsx)(auth_input_1.AuthInput, { label: "Email", type: "email", autoComplete: "email", icon: lucide_react_1.Mail, ...register("email"), error: errors.email?.message }), error ? (0, jsx_runtime_1.jsx)("p", { className: "rounded-[16px] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error", children: error }) : null, success ? (0, jsx_runtime_1.jsx)("p", { className: "rounded-[16px] border border-success/20 bg-success/10 px-4 py-3 text-sm text-success", children: success }) : null, (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", disabled: busy, className: "h-14 w-full rounded-[16px] text-base font-semibold", children: busy ? "Sending reset link..." : "Send reset link" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-center text-sm text-slate-600", children: ["Remembered your password?", ' ', (0, jsx_runtime_1.jsx)(link_1.default, { href: "/login", className: "font-semibold text-brand transition hover:text-brandHover", children: "Sign in" }), "."] })] }));
}

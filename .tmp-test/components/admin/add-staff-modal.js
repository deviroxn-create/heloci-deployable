"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddStaffModal = AddStaffModal;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_hook_form_1 = require("react-hook-form");
const zod_1 = require("@hookform/resolvers/zod");
const zod_2 = require("zod");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const staff_actions_1 = require("@/actions/staff.actions");
const schema = zod_2.z
    .object({
    name: zod_2.z.string().min(2, "Enter the staff member's full name."),
    email: zod_2.z.string().email("Enter a valid email address."),
    password: zod_2.z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: zod_2.z.string().min(8, "Please confirm the password.")
})
    .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"]
});
function AddStaffModal({ open, onClose }) {
    const [serverError, setServerError] = (0, react_1.useState)(null);
    const [successEmail, setSuccessEmail] = (0, react_1.useState)(null);
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = (0, react_hook_form_1.useForm)({ resolver: (0, zod_1.zodResolver)(schema) });
    const onSubmit = async (values) => {
        setServerError(null);
        const result = await (0, staff_actions_1.createStaffMember)({
            name: values.name,
            email: values.email,
            password: values.password
        });
        if (!result.success) {
            setServerError(result.error);
            return;
        }
        setSuccessEmail(result.email);
        reset();
    };
    const handleClose = () => {
        reset();
        setServerError(null);
        setSuccessEmail(null);
        onClose();
    };
    if (!open)
        return null;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 bg-slate-950/40 backdrop-blur-sm", onClick: handleClose, "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative w-full max-w-md rounded-[28px] bg-white p-8 shadow-2xl", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-brand", children: "Admin action" }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-1 text-xl font-semibold text-slate-950", children: "Add staff member" })] }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: handleClose, className: "inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border text-slate-500 hover:bg-slate-50 transition", "aria-label": "Close", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-4 w-4" }) })] }), successEmail ? ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-[20px] border border-success/20 bg-success/5 px-5 py-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "font-semibold text-success", children: "Staff account created" }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-1 text-sm text-slate-600", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: successEmail }), " can now sign in and access the staff dashboard."] })] }), (0, jsx_runtime_1.jsx)(button_1.Button, { className: "w-full h-12 rounded-2xl", onClick: handleClose, children: "Done" })] })) : ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-4", children: [(0, jsx_runtime_1.jsx)(Field, { label: "Full name", error: errors.name?.message, children: (0, jsx_runtime_1.jsx)("input", { ...register("name"), type: "text", autoComplete: "name", placeholder: "e.g. Maya Thompson", className: "input-base" }) }), (0, jsx_runtime_1.jsx)(Field, { label: "Email address", error: errors.email?.message, children: (0, jsx_runtime_1.jsx)("input", { ...register("email"), type: "email", autoComplete: "email", placeholder: "staff@heloci.ngo", className: "input-base" }) }), (0, jsx_runtime_1.jsx)(Field, { label: "Temporary password", error: errors.password?.message, children: (0, jsx_runtime_1.jsx)("input", { ...register("password"), type: "password", autoComplete: "new-password", placeholder: "Min. 8 characters", className: "input-base" }) }), (0, jsx_runtime_1.jsx)(Field, { label: "Confirm password", error: errors.confirmPassword?.message, children: (0, jsx_runtime_1.jsx)("input", { ...register("confirmPassword"), type: "password", autoComplete: "new-password", placeholder: "Repeat the password", className: "input-base" }) }), serverError ? ((0, jsx_runtime_1.jsx)("p", { className: "rounded-[16px] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error", children: serverError })) : null, (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-3 pt-2", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "outline", className: "flex-1 h-12 rounded-2xl", onClick: handleClose, disabled: isSubmitting, children: "Cancel" }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", className: "flex-1 h-12 rounded-2xl", disabled: isSubmitting, children: isSubmitting ? "Creating..." : "Create account" })] })] }))] })] }));
}
function Field({ label, error, children }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-1.5", children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-slate-700", children: label }), children, error ? (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-error", children: error }) : null] }));
}

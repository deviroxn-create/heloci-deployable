"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Page;
const jsx_runtime_1 = require("react/jsx-runtime");
const auth_card_1 = require("@/components/auth/auth-card");
const forgot_password_form_1 = require("@/components/auth/forgot-password-form");
function Page() {
    return ((0, jsx_runtime_1.jsx)(auth_card_1.AuthCard, { heading: "Reset your password", description: "Enter the email tied to your Heloci account and we\u2019ll send reset instructions.", children: (0, jsx_runtime_1.jsx)(forgot_password_form_1.ForgotPasswordForm, {}) }));
}

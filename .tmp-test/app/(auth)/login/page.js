"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Page;
const jsx_runtime_1 = require("react/jsx-runtime");
const auth_card_1 = require("@/components/auth/auth-card");
const login_form_1 = require("@/components/auth/login-form");
const security_indicators_1 = require("@/components/auth/security-indicators");
function Page() {
    return ((0, jsx_runtime_1.jsxs)(auth_card_1.AuthCard, { heading: "Welcome back", description: "Continue your housing journey with Heloci.", children: [(0, jsx_runtime_1.jsx)(login_form_1.LoginForm, {}), (0, jsx_runtime_1.jsx)(security_indicators_1.SecurityIndicators, {})] }));
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Page;
const jsx_runtime_1 = require("react/jsx-runtime");
const auth_card_1 = require("@/components/auth/auth-card");
const register_form_1 = require("@/components/auth/register-form");
const security_indicators_1 = require("@/components/auth/security-indicators");
function Page() {
    return ((0, jsx_runtime_1.jsxs)(auth_card_1.AuthCard, { heading: "Create your Heloci account", description: "Start with the essentials and we\u2019ll help you onboard step by step.", children: [(0, jsx_runtime_1.jsx)(register_form_1.RegisterForm, {}), (0, jsx_runtime_1.jsx)(security_indicators_1.SecurityIndicators, {})] }));
}

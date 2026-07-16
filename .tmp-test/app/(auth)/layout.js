"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = AuthRouteLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
const auth_layout_1 = require("@/components/auth/auth-layout");
exports.metadata = {
    title: "Heloci Auth",
    description: "Sign in or create a Heloci account to access housing support."
};
function AuthRouteLayout({ children }) {
    return (0, jsx_runtime_1.jsx)(auth_layout_1.AuthLayout, { children: children });
}

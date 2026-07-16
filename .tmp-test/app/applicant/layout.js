"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ApplicantLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
const navigation_1 = require("next/navigation");
const session_1 = require("@/lib/auth/session");
async function ApplicantLayout({ children }) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user) {
        (0, navigation_1.redirect)("/login");
    }
    if (user.role !== "APPLICANT") {
        if (user.role === "STAFF") {
            (0, navigation_1.redirect)("/staff/dashboard");
        }
        (0, navigation_1.redirect)("/admin/dashboard");
    }
    return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: children });
}

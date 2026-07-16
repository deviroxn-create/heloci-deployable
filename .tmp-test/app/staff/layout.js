"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StaffLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
const navigation_1 = require("next/navigation");
const session_1 = require("@/lib/auth/session");
async function StaffLayout({ children }) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user) {
        (0, navigation_1.redirect)("/login");
    }
    if (user.role !== "STAFF") {
        if (user.role === "APPLICANT") {
            (0, navigation_1.redirect)("/applicant/dashboard");
        }
        (0, navigation_1.redirect)("/admin/dashboard");
    }
    return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: children });
}

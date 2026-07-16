"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationSubmittedEmail = ApplicationSubmittedEmail;
const jsx_runtime_1 = require("react/jsx-runtime");
function ApplicationSubmittedEmail({ name }) {
    return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { children: "Application Received" }), (0, jsx_runtime_1.jsxs)("p", { children: ["Hi ", name, ","] }), (0, jsx_runtime_1.jsx)("p", { children: "We have received your housing assistance application and our team is reviewing it." })] }));
}

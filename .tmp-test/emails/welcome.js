"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WelcomeEmail = WelcomeEmail;
const jsx_runtime_1 = require("react/jsx-runtime");
function WelcomeEmail({ name }) {
    return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { children: "Welcome to Heloci" }), (0, jsx_runtime_1.jsxs)("p", { children: ["Hi ", name, ","] }), (0, jsx_runtime_1.jsx)("p", { children: "Thanks for joining our housing support community." })] }));
}

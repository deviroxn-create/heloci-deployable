"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
const google_1 = require("next/font/google");
require("./globals.css");
const site_1 = require("@/lib/constants/site");
const plusJakarta = (0, google_1.Plus_Jakarta_Sans)({
    subsets: ["latin"],
    variable: "--font-plus-jakarta"
});
exports.metadata = {
    title: site_1.siteConfig.name,
    description: site_1.siteConfig.description,
    metadataBase: new URL(site_1.siteConfig.url)
};
function RootLayout({ children }) {
    return ((0, jsx_runtime_1.jsx)("html", { lang: "en", "data-scroll-behavior": "smooth", className: `${plusJakarta.variable} scroll-smooth`, children: (0, jsx_runtime_1.jsx)("body", { className: "min-h-screen bg-surface font-sans text-slate-950 antialiased", children: children }) }));
}

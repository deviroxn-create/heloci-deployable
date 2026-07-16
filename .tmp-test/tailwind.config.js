"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                brand: "#003DB8",
                brandHover: "#002E8A",
                panel: "#0F172A",
                surface: "#F8FAFC",
                border: "#E2E8F0",
                muted: "#64748B",
                success: "#22C55E",
                warning: "#F59E0B",
                error: "#EF4444",
                info: "#0EA5E9"
            },
            boxShadow: {
                card: "0 24px 50px rgba(15, 23, 42, 0.08)",
                soft: "0 18px 40px rgba(15, 23, 42, 0.06)",
                overlay: "0 32px 70px rgba(15, 23, 42, 0.12)"
            },
            fontFamily: {
                sans: ["var(--font-plus-jakarta)", "Inter", "sans-serif"]
            }
        }
    },
    plugins: []
};
exports.default = config;

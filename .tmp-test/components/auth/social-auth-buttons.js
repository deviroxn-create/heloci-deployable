"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialAuthButtons = SocialAuthButtons;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const client_1 = require("@/lib/supabase/client");
function SocialAuthButtons({ onError }) {
    const [busy, setBusy] = (0, react_1.useState)(false);
    const handleProvider = async (provider) => {
        if (typeof window === "undefined") {
            return;
        }
        setBusy(true);
        const { error } = await client_1.supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/applicant/dashboard`
            }
        });
        setBusy(false);
        if (error) {
            onError?.(error.message);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)(button_1.Button, { type: "button", variant: "outline", className: "h-14 w-full justify-center gap-2 text-slate-700", onClick: () => handleProvider("google"), disabled: busy, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Globe, { className: "h-5 w-5" }), "Continue with Google"] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { type: "button", variant: "outline", className: "h-14 w-full justify-center gap-2 text-slate-700", onClick: () => handleProvider("apple"), disabled: busy, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Apple, { className: "h-5 w-5" }), "Continue with Apple"] })] }));
}

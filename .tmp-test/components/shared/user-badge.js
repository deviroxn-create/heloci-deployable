"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBadge = UserBadge;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const client_1 = require("@/lib/supabase/client");
/**
 * Displays the signed-in user's name (from full_name metadata) with a
 * letter avatar. Falls back to the email prefix if no name is set.
 */
function UserBadge() {
    const [name, setName] = (0, react_1.useState)("");
    const [email, setEmail] = (0, react_1.useState)("");
    (0, react_1.useEffect)(() => {
        client_1.supabase.auth.getUser().then(({ data }) => {
            const user = data.user;
            if (!user)
                return;
            const fullName = user.user_metadata?.full_name ??
                user.user_metadata?.name ??
                "";
            setName(fullName);
            setEmail(user.email ?? "");
        });
    }, []);
    // What to show as the display label
    const displayName = name || email.split("@")[0] || "—";
    // First letter for the avatar circle
    const initial = displayName.charAt(0).toUpperCase();
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2.5", children: [(0, jsx_runtime_1.jsx)("div", { "aria-hidden": "true", className: "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-sm font-bold text-brand", children: initial }), (0, jsx_runtime_1.jsxs)("div", { className: "hidden sm:block leading-tight", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-slate-950 truncate max-w-[140px]", children: displayName }), name && ((0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-400 truncate max-w-[140px]", children: email }))] })] }));
}

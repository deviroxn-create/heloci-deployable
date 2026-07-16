"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const session_1 = require("@/lib/auth/session");
const engine_1 = require("@/lib/eligibility/engine");
async function POST() {
    const user = await (0, session_1.getCurrentUser)();
    if (!user) {
        return server_1.NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    try {
        const matches = await (0, engine_1.runEligibilityEngine)(user.id);
        return server_1.NextResponse.json({ matches, totalEligible: matches.filter((item) => item.isEligible).length });
    }
    catch (error) {
        return server_1.NextResponse.json({ error: error.message || "Unable to run eligibility engine." }, { status: 500 });
    }
}

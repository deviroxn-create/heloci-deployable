"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const session_1 = require("@/lib/auth/session");
const engine_1 = require("@/lib/eligibility/engine");
const engine_2 = require("@/lib/matching/engine");
async function POST() {
    const user = await (0, session_1.getCurrentUser)();
    if (!user) {
        return server_1.NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    try {
        await (0, engine_1.runEligibilityEngine)(user.id);
        const matches = await (0, engine_2.getProgramMatches)(user.id);
        return server_1.NextResponse.json(matches);
    }
    catch (error) {
        return server_1.NextResponse.json({ error: error.message || "Unable to refresh matches." }, { status: 500 });
    }
}

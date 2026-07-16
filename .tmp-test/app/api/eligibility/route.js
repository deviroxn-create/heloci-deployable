"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const session_1 = require("@/lib/auth/session");
const engine_1 = require("@/lib/eligibility/engine");
async function GET() {
    const user = await (0, session_1.getCurrentUser)();
    if (!user) {
        return server_1.NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (user.role !== "APPLICANT") {
        return server_1.NextResponse.json({ error: "Only applicants can access eligibility matches." }, { status: 403 });
    }
    try {
        const result = await (0, engine_1.runEligibilityEngine)(user.id);
        return server_1.NextResponse.json(result);
    }
    catch (error) {
        return server_1.NextResponse.json({ error: error.message || "Unable to load eligibility results." }, { status: 500 });
    }
}

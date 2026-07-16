"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const session_1 = require("@/lib/auth/session");
const applicant_profile_service_1 = require("@/services/applicant-profile.service");
async function POST(req) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user) {
        return server_1.NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (user.role !== "APPLICANT") {
        return server_1.NextResponse.json({ error: "Only applicants can save a profile." }, { status: 403 });
    }
    const values = await req.json();
    try {
        await (0, applicant_profile_service_1.saveApplicantProfile)({ userId: user.id, ...values });
        return server_1.NextResponse.json({ success: true });
    }
    catch (error) {
        return server_1.NextResponse.json({ error: error.message || "Unable to save profile." }, { status: 500 });
    }
}

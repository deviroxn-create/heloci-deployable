"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const session_1 = require("@/lib/auth/session");
const applicant_profile_schema_1 = require("@/lib/validations/applicant-profile.schema");
const applicant_profile_service_1 = require("@/services/applicant-profile.service");
async function GET() {
    const user = await (0, session_1.getCurrentUser)();
    if (!user) {
        return server_1.NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const profile = await (0, applicant_profile_service_1.loadApplicantProfile)(user.id);
    const completeness = {
        score: 0,
        status: "NOT_STARTED",
        completedSections: []
    };
    return server_1.NextResponse.json({
        profile,
        completeness
    });
}
async function POST(req) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user) {
        return server_1.NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (user.role !== "APPLICANT") {
        return server_1.NextResponse.json({ error: "Only applicants can save a profile." }, { status: 403 });
    }
    try {
        const body = await req.json();
        const parsed = applicant_profile_schema_1.applicantProfileSchema.parse(body);
        const result = await (0, applicant_profile_service_1.saveApplicantProfile)({ userId: user.id, ...parsed });
        return server_1.NextResponse.json(result);
    }
    catch (error) {
        return server_1.NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save profile." }, { status: 400 });
    }
}

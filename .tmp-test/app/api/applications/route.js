"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const session_1 = require("@/lib/auth/session");
const application_service_1 = require("@/services/application.service");
async function POST(req) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user) {
        return server_1.NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (user.role !== "APPLICANT") {
        return server_1.NextResponse.json({ error: "Only applicants can create applications." }, { status: 403 });
    }
    const body = await req.json();
    const programSlug = body.programSlug;
    const programName = body.programName;
    if (!programSlug || !programName) {
        return server_1.NextResponse.json({ error: "Program slug and name are required." }, { status: 400 });
    }
    try {
        const application = await (0, application_service_1.createApplication)(user.id, programSlug, programName);
        return server_1.NextResponse.json({ application });
    }
    catch (error) {
        return server_1.NextResponse.json({ error: error.message || "Unable to create application." }, { status: 500 });
    }
}

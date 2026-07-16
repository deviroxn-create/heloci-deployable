"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const session_1 = require("@/lib/auth/session");
const email_service_1 = require("@/lib/email/email.service");
const application_service_1 = require("@/services/application.service");
async function POST(request) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user) {
        return server_1.NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const body = await request.json();
    const programId = body.programId;
    const programName = body.programName || body.programSlug || "Selected program";
    const payload = body.data;
    if (!programId) {
        return server_1.NextResponse.json({ error: "Program is required." }, { status: 400 });
    }
    try {
        const application = await (0, application_service_1.createApplication)(user.id, programId, programName);
        const emailService = new email_service_1.EmailService();
        await emailService.sendEmail({
            to: user.email,
            template: "application_received",
            data: {
                firstName: user.name || "there",
                applicationId: application.id,
                status: application.status,
                programName
            }
        });
        return server_1.NextResponse.json({ success: true, applicationId: application.id, payload });
    }
    catch (error) {
        return server_1.NextResponse.json({ error: error.message || "Unable to create application." }, { status: 500 });
    }
}

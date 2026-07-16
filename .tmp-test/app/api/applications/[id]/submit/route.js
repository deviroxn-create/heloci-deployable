"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const client_1 = require("@/lib/prisma/client");
const session_1 = require("@/lib/auth/session");
const notification_service_1 = require("@/lib/notifications/notification.service");
const validator_1 = require("@/lib/forms/validator");
const renderer_1 = require("@/lib/forms/renderer");
async function POST(req, { params }) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user) {
        return server_1.NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const payload = body.data ?? {};
    const application = await client_1.prisma.programApplication.findUnique({ where: { id } });
    if (!application || application.userId !== user.id) {
        return server_1.NextResponse.json({ error: "Application not found." }, { status: 404 });
    }
    const form = await (0, renderer_1.getFormForProgram)((await client_1.prisma.program.findUnique({ where: { id: application.programId } }))?.slug ?? "", user.id);
    const allQuestions = (form.pages ?? []).flatMap((page) => page.questions);
    const validation = (0, validator_1.validatePage)(allQuestions, payload);
    if (!validation.valid) {
        return server_1.NextResponse.json({ errors: validation.errors }, { status: 400 });
    }
    await client_1.prisma.programApplication.update({
        where: { id },
        data: {
            status: "submitted",
            submittedAt: new Date(),
            data: { ...(typeof application.data === "object" && application.data !== null ? application.data : {}), ...payload }
        }
    });
    await notification_service_1.notificationService.notify("application_submitted", { userId: user.id, programId: application.programId, applicationId: application.id });
    return server_1.NextResponse.json({ success: true });
}

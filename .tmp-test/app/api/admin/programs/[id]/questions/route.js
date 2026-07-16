"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const session_1 = require("@/lib/auth/session");
const question_service_1 = require("@/lib/programs/question-service");
const notification_service_1 = require("@/lib/notifications/notification.service");
async function GET(_req, { params }) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user) {
        return server_1.NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const { id } = await params;
    const questionSet = await (0, question_service_1.getActiveQuestionSet)(id);
    return server_1.NextResponse.json(questionSet);
}
async function POST(req, { params }) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user) {
        return server_1.NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const validation = (0, question_service_1.validateQuestionSetPayload)(body);
    if (!validation.valid) {
        return server_1.NextResponse.json({ error: validation.error }, { status: 400 });
    }
    try {
        const questionSet = await (0, question_service_1.publishQuestionSet)(id, user.id, body);
        await notification_service_1.notificationService.notify("admin_action", {
            userId: user.id,
            recipientEmail: user.email,
            locale: "en"
        });
        return server_1.NextResponse.json(questionSet);
    }
    catch (error) {
        return server_1.NextResponse.json({ error: error?.message ?? "Unable to save question set." }, { status: 400 });
    }
}

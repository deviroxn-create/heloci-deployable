"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const client_1 = require("@/lib/prisma/client");
const session_1 = require("@/lib/auth/session");
const notification_service_1 = require("@/lib/notifications/notification.service");
async function POST(req, { params }) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user) {
        return server_1.NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const pageData = body.pageData;
    const currentPage = body.currentPage;
    const application = await client_1.prisma.programApplication.findUnique({ where: { id } });
    if (!application || application.userId !== user.id) {
        return server_1.NextResponse.json({ error: "Application not found." }, { status: 404 });
    }
    const updated = await client_1.prisma.programApplication.update({
        where: { id },
        data: {
            data: {
                ...(typeof application.data === "object" && application.data !== null ? application.data : {}),
                ...(pageData ?? {})
            },
            currentPage: currentPage ?? application.currentPage ?? 0
        }
    });
    if (application.status === "draft") {
        await notification_service_1.notificationService.notify("application_started", { userId: user.id, programId: application.programId, applicationId: application.id });
    }
    return server_1.NextResponse.json({ success: true, nextPage: updated.currentPage });
}

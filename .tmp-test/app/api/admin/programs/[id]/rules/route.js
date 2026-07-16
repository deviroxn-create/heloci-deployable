"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const session_1 = require("@/lib/auth/session");
const client_1 = require("@/lib/prisma/client");
const rbac_1 = require("@/lib/auth/rbac");
const notification_service_1 = require("@/lib/notifications/notification.service");
async function POST(req, { params }) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user) {
        return server_1.NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const { id } = await params;
    const program = await client_1.prisma.program.findUnique({ where: { id } });
    if (!program) {
        return server_1.NextResponse.json({ error: "Program not found." }, { status: 404 });
    }
    await (0, rbac_1.requireOrgRole)(user.id, program.organizationId, ["org_admin"]);
    const body = await req.json();
    await client_1.prisma.eligibilityRule.updateMany({
        where: { programId: id, isActive: true },
        data: { isActive: false }
    });
    const rule = await client_1.prisma.eligibilityRule.create({
        data: {
            programId: id,
            version: (body.version ?? 1),
            name: body.name ?? "v1",
            rules: body.rules ?? {},
            isActive: true,
            createdBy: user.id
        }
    });
    await notification_service_1.notificationService.notify("admin_action", { userId: user.id, recipientEmail: user.email, locale: "en" });
    return server_1.NextResponse.json(rule);
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const session_1 = require("@/lib/auth/session");
const client_1 = require("@/lib/prisma/client");
async function GET() {
    const user = await (0, session_1.getCurrentUser)();
    if (!user)
        return server_1.NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    const orgId = user.organizationId;
    if (!orgId)
        return server_1.NextResponse.json({ error: "no_org" }, { status: 400 });
    const members = await client_1.prisma.organizationMember.findMany({ where: { organizationId: orgId }, include: { user: true } });
    return server_1.NextResponse.json(members);
}

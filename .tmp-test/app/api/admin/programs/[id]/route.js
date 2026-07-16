"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PATCH = PATCH;
const server_1 = require("next/server");
const session_1 = require("@/lib/auth/session");
const client_1 = require("@/lib/prisma/client");
const dashboard_service_1 = require("@/lib/organizations/dashboard-service");
async function GET(_req, { params }) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user)
        return server_1.NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    const { id } = await params;
    const program = await client_1.prisma.program.findUnique({ where: { id } });
    if (!program)
        return server_1.NextResponse.json({ error: "not_found" }, { status: 404 });
    if (program.organizationId !== user.organizationId)
        return server_1.NextResponse.json({ error: "forbidden" }, { status: 403 });
    return server_1.NextResponse.json(program);
}
async function PATCH(req, { params }) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user)
        return server_1.NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    try {
        const body = await req.json();
        const { id } = await params;
        const updated = await (0, dashboard_service_1.updateProgram)(id, user.id, body);
        return server_1.NextResponse.json(updated);
    }
    catch (err) {
        return server_1.NextResponse.json({ error: err.message }, { status: 400 });
    }
}

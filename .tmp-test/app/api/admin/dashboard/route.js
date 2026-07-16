"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const dashboard_service_1 = require("@/lib/organizations/dashboard-service");
const session_1 = require("@/lib/auth/session");
async function GET(_req) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user)
        return server_1.NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    const orgId = user.organizationId;
    if (!orgId)
        return server_1.NextResponse.json({ error: "no_org" }, { status: 400 });
    const stats = await (0, dashboard_service_1.getOrgDashboard)(orgId, user.id);
    return server_1.NextResponse.json(stats);
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const session_1 = require("@/lib/auth/session");
const dashboard_service_1 = require("@/lib/organizations/dashboard-service");
async function POST(_req, { params }) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user)
        return server_1.NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    try {
        const { id } = await params;
        const archived = await (0, dashboard_service_1.archiveProgram)(id, user.id);
        return server_1.NextResponse.json(archived);
    }
    catch (err) {
        return server_1.NextResponse.json({ error: err.message }, { status: 400 });
    }
}

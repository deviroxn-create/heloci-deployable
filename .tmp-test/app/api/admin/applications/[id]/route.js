"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const session_1 = require("@/lib/auth/session");
const review_service_1 = require("@/lib/applications/review-service");
async function GET(_req, { params }) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user) {
        return server_1.NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const { id } = await params;
    try {
        const detail = await (0, review_service_1.getApplicationDetail)(id, user.id);
        return server_1.NextResponse.json(detail);
    }
    catch (error) {
        return server_1.NextResponse.json({ error: error.message }, { status: 403 });
    }
}

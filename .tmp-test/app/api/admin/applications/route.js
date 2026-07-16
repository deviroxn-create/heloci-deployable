"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const session_1 = require("@/lib/auth/session");
const review_service_1 = require("@/lib/applications/review-service");
async function GET(req) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user) {
        return server_1.NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const url = new URL(req.url);
    const status = url.searchParams.getAll("status");
    const assignedTo = url.searchParams.get("assignedTo") ?? undefined;
    const programId = url.searchParams.get("programId") ?? undefined;
    const search = url.searchParams.get("search") ?? undefined;
    const orgId = url.searchParams.get("organizationId");
    if (!orgId) {
        return server_1.NextResponse.json({ error: "organizationId is required." }, { status: 400 });
    }
    try {
        const result = await (0, review_service_1.getApplicationsForReview)(orgId, {
            staffUserId: user.id,
            status: status.length ? status : undefined,
            assignedTo,
            programId,
            search
        });
        return server_1.NextResponse.json(result);
    }
    catch (error) {
        return server_1.NextResponse.json({ error: error.message }, { status: 403 });
    }
}

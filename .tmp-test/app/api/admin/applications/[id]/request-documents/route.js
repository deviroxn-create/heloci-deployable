"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const session_1 = require("@/lib/auth/session");
const review_service_1 = require("@/lib/applications/review-service");
async function POST(req, { params }) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user) {
        return server_1.NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const documents = body.documents;
    const reason = body.reason;
    if (!documents || !documents.length) {
        return server_1.NextResponse.json({ error: "documents are required." }, { status: 400 });
    }
    try {
        const result = await (0, review_service_1.updateApplicationStatus)(id, user.id, "request_info", { reason, requestedDocs: documents });
        return server_1.NextResponse.json(result);
    }
    catch (error) {
        return server_1.NextResponse.json({ error: error.message }, { status: 403 });
    }
}

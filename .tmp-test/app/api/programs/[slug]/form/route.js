"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const session_1 = require("@/lib/auth/session");
const renderer_1 = require("@/lib/forms/renderer");
async function GET(_req, { params }) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user) {
        return server_1.NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const { slug } = await params;
    const form = await (0, renderer_1.getFormForProgram)(slug, user.id);
    return server_1.NextResponse.json(form);
}

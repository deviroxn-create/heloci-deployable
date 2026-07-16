"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const session_1 = require("@/lib/auth/session");
const workflow_engine_1 = require("@/lib/workflows/workflow-engine");
async function GET(_req, { params }) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user) {
        return server_1.NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const { id } = await params;
    const triggers = await (0, workflow_engine_1.listWorkflowTriggers)(id);
    return server_1.NextResponse.json(triggers);
}
async function POST(req, { params }) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user) {
        return server_1.NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const body = await req.json();
    try {
        const { id } = await params;
        const trigger = await (0, workflow_engine_1.createWorkflowTrigger)(id, user.id, {
            name: body.name,
            event: body.event,
            condition: body.condition,
            action: body.action,
            actionConfig: body.actionConfig,
            isActive: body.isActive,
            order: body.order
        });
        return server_1.NextResponse.json(trigger);
    }
    catch (error) {
        return server_1.NextResponse.json({ error: error?.message ?? "Unable to create workflow trigger." }, { status: 400 });
    }
}

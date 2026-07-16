"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
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
    const programs = await client_1.prisma.program.findMany({ where: { organizationId: orgId, isArchived: false }, orderBy: { priority: "desc" } });
    return server_1.NextResponse.json(programs);
}
async function POST(req) {
    const user = await (0, session_1.getCurrentUser)();
    if (!user)
        return server_1.NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    const orgId = user.organizationId;
    if (!orgId)
        return server_1.NextResponse.json({ error: "no_org" }, { status: 400 });
    const body = await req.json();
    try {
        const { createProgram } = await Promise.resolve().then(() => __importStar(require("@/lib/organizations/dashboard-service")));
        const program = await createProgram(orgId, user.id, body);
        return server_1.NextResponse.json(program, { status: 201 });
    }
    catch (err) {
        return server_1.NextResponse.json({ error: err.message }, { status: 400 });
    }
}
// duplicate admin/global handlers removed in favor of org-scoped handlers above

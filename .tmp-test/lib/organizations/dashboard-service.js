"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrgDashboard = getOrgDashboard;
exports.createProgram = createProgram;
exports.updateProgram = updateProgram;
exports.archiveProgram = archiveProgram;
const client_1 = require("@/lib/prisma/client");
const rbac_1 = require("@/lib/auth/rbac");
const notification_service_1 = require("@/lib/notifications/notification.service");
async function getOrgDashboard(orgId, staffUserId) {
    await (0, rbac_1.requireOrgRole)(staffUserId, orgId, ["org_admin", "reviewer", "viewer"]);
    const totalPrograms = await client_1.prisma.program.count({ where: { organizationId: orgId, isArchived: false } });
    const activePrograms = await client_1.prisma.program.count({ where: { organizationId: orgId, status: "active", isArchived: false } });
    const whereApps = { program: { organizationId: orgId } };
    const totalApplications = await client_1.prisma.programApplication.count({ where: whereApps });
    const group = await client_1.prisma.programApplication.groupBy({
        by: ["status"],
        where: whereApps,
        _count: { status: true }
    });
    const applicationsByStatus = {};
    group.forEach((g) => (applicationsByStatus[g.status] = g._count.status));
    const approved = applicationsByStatus["approved"] ?? 0;
    const rejected = applicationsByStatus["rejected"] ?? 0;
    const approvalRate = approved + rejected === 0 ? 0 : (approved / (approved + rejected)) * 100;
    // avg decision days
    const decided = await client_1.prisma.programApplication.findMany({
        where: { program: { organizationId: orgId }, reviewedAt: { not: null }, submittedAt: { not: null } },
        select: { reviewedAt: true, submittedAt: true }
    });
    const avgDecisionDays = decided.length
        ? decided.reduce((acc, cur) => acc + (cur.reviewedAt.getTime() - cur.submittedAt.getTime()), 0) / decided.length / (1000 * 60 * 60 * 24)
        : null;
    const recentApplicationsRaw = await client_1.prisma.programApplication.findMany({
        where: whereApps,
        include: { user: true, program: true },
        orderBy: { submittedAt: "desc" },
        take: 5
    });
    const recentApplications = recentApplicationsRaw.map((a) => ({
        id: a.id,
        applicantName: a.user?.name ?? null,
        programName: a.program.name,
        status: a.status,
        submittedAt: a.submittedAt
    }));
    return {
        totalPrograms,
        activePrograms,
        totalApplications,
        applicationsByStatus,
        approvalRate,
        avgDecisionDays,
        recentApplications
    };
}
async function createProgram(orgId, staffUserId, data) {
    await (0, rbac_1.requireOrgRole)(staffUserId, orgId, ["org_admin"]);
    const existing = await client_1.prisma.program.findUnique({ where: { slug: data.slug } });
    if (existing)
        throw new Error("slug_taken");
    const program = await client_1.prisma.program.create({
        data: {
            organizationId: orgId,
            name: data.name,
            slug: data.slug,
            createdBy: staffUserId,
            housingGoal: data.housingGoal,
            category: data.category,
            description: data.description,
            deadline: data.deadline ?? null,
            matchDescription: data.matchDescription ?? null,
            requiredDocuments: data.requiredDocuments ? { set: data.requiredDocuments } : undefined,
            status: "draft",
            isArchived: false
        }
    });
    await client_1.prisma.auditLog.create({ data: { userId: staffUserId, entity: "Program", action: "program_created", meta: { programId: program.id } } });
    return program;
}
async function updateProgram(programId, staffUserId, data) {
    const program = await client_1.prisma.program.findUnique({ where: { id: programId } });
    if (!program)
        throw new Error("not_found");
    await (0, rbac_1.requireOrgRole)(staffUserId, program.organizationId, ["org_admin"]);
    const updateData = { ...data };
    if (data.status === "active" && !program.publishedAt) {
        updateData.publishedAt = new Date();
    }
    const updated = await client_1.prisma.program.update({ where: { id: programId }, data: updateData });
    await client_1.prisma.auditLog.create({ data: { userId: staffUserId, entity: "Program", action: "program_updated", meta: { programId } } });
    if (data.status === "active") {
        // notify org admins
        const admins = await client_1.prisma.organizationMember.findMany({ where: { organizationId: program.organizationId, role: "org_admin" }, include: { user: true } });
        for (const a of admins) {
            await notification_service_1.notificationService.notify("program_published", { userId: a.userId, programName: updated.name, slug: updated.slug });
        }
    }
    return updated;
}
async function archiveProgram(programId, staffUserId) {
    const program = await client_1.prisma.program.findUnique({ where: { id: programId } });
    if (!program)
        throw new Error("not_found");
    await (0, rbac_1.requireOrgRole)(staffUserId, program.organizationId, ["org_admin"]);
    const updated = await client_1.prisma.program.update({ where: { id: programId }, data: { isArchived: true, status: "archived" } });
    await client_1.prisma.auditLog.create({ data: { userId: staffUserId, entity: "Program", action: "program_archived", meta: { programId } } });
    return updated;
}

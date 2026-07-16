"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApplicationsForReview = getApplicationsForReview;
exports.getApplicationDetail = getApplicationDetail;
exports.updateApplicationStatus = updateApplicationStatus;
exports.assignApplication = assignApplication;
exports.addInternalNote = addInternalNote;
const client_1 = require("@/lib/prisma/client");
const applicant_profile_service_1 = require("@/services/applicant-profile.service");
const notification_service_1 = require("@/lib/notifications/notification.service");
const rbac_1 = require("@/lib/auth/rbac");
async function getApplicationsForReview(orgId, filters) {
    await (0, rbac_1.requireOrgRole)(filters.staffUserId, orgId, ["org_admin", "reviewer", "viewer"]);
    const where = {
        program: { organizationId: orgId }
    };
    if (filters.status?.length) {
        where.status = { in: filters.status };
    }
    if (filters.assignedTo) {
        where.assignedToId = filters.assignedTo === "me" ? filters.staffUserId : filters.assignedTo;
    }
    if (filters.programId) {
        where.programId = filters.programId;
    }
    if (filters.search) {
        where.OR = [
            { user: { email: { contains: filters.search, mode: "insensitive" } } },
            { user: { name: { contains: filters.search, mode: "insensitive" } } }
        ];
    }
    const applications = await client_1.prisma.programApplication.findMany({
        where,
        include: {
            user: true,
            program: true,
            assignedTo: true,
            events: { orderBy: { createdAt: "asc" } },
            documentRequests: true
        },
        orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }]
    });
    const statusCounts = await client_1.prisma.programApplication.groupBy({
        by: ["status"],
        where,
        _count: { status: true }
    });
    return {
        applications,
        counts: statusCounts.reduce((acc, item) => {
            acc[item.status] = item._count.status;
            return acc;
        }, {})
    };
}
async function getApplicationDetail(applicationId, staffUserId) {
    const application = await client_1.prisma.programApplication.findUnique({
        where: { id: applicationId },
        include: {
            user: true,
            program: true,
            assignedTo: true,
            reviewedBy: true,
            events: { orderBy: { createdAt: "asc" } },
            documentRequests: true
        }
    });
    if (!application) {
        throw new Error("Application not found");
    }
    await (0, rbac_1.requireOrgRole)(staffUserId, application.program.organizationId, ["org_admin", "reviewer", "viewer"]);
    const applicantProfile = await (0, applicant_profile_service_1.loadApplicantProfile)(application.userId);
    const eligibilityResult = await client_1.prisma.eligibilityResult.findUnique({
        where: { userId_programId: { userId: application.userId, programId: application.programId } }
    });
    return {
        application,
        applicantProfile,
        eligibilityResult,
        events: application.events,
        documentRequests: application.documentRequests
    };
}
async function updateApplicationStatus(applicationId, staffUserId, action, data) {
    const application = await client_1.prisma.programApplication.findUnique({
        where: { id: applicationId },
        include: { program: true }
    });
    if (!application) {
        throw new Error("Application not found");
    }
    await (0, rbac_1.requireOrgRole)(staffUserId, application.program.organizationId, ["org_admin", "reviewer"]);
    const statusMap = {
        approve: "approved",
        reject: "rejected",
        waitlist: "waitlisted",
        request_info: "more_info_requested"
    };
    const decision = statusMap[action];
    const previousStatus = application.status;
    const updated = await client_1.prisma.$transaction(async (tx) => {
        const updatedApplication = await tx.programApplication.update({
            where: { id: applicationId },
            data: {
                status: decision,
                decision,
                decisionReason: data.reason,
                reviewedById: staffUserId,
                reviewedAt: new Date(),
                internalNotes: data.internalNote ? [application.internalNotes ?? "", data.internalNote].filter(Boolean).join("\n\n") : application.internalNotes
            },
            include: {
                user: true,
                program: true
            }
        });
        await tx.applicationEvent.create({
            data: {
                applicationId,
                type: "status_changed",
                actorId: staffUserId,
                fromStatus: previousStatus,
                toStatus: decision,
                metadata: {
                    reason: data.reason,
                    internalNote: data.internalNote,
                    requestedDocs: data.requestedDocs ?? []
                }
            }
        });
        if (action === "request_info" && data.requestedDocs?.length) {
            await Promise.all(data.requestedDocs.map((documentType) => tx.documentRequest.create({
                data: {
                    applicationId,
                    documentType,
                    requestedBy: staffUserId,
                    notes: data.reason
                }
            })));
        }
        if (data.internalNote) {
            await tx.applicationEvent.create({
                data: {
                    applicationId,
                    type: "note_added",
                    actorId: staffUserId,
                    metadata: { note: data.internalNote }
                }
            });
        }
        return updatedApplication;
    });
    const notifyEventMap = {
        approved: "application_approved",
        rejected: "application_rejected",
        waitlisted: "application_waitlisted",
        more_info_requested: "documents_requested"
    };
    const eventName = notifyEventMap[decision];
    if (eventName) {
        await notification_service_1.notificationService.notify(eventName, {
            userId: application.userId,
            applicationId: application.id,
            programName: application.program.name,
            reason: data.reason,
            requestedDocs: data.requestedDocs,
            locale: "en"
        });
    }
    return updated;
}
async function assignApplication(applicationId, staffUserId, assignToUserId) {
    const application = await client_1.prisma.programApplication.findUnique({
        where: { id: applicationId },
        include: { program: true }
    });
    if (!application) {
        throw new Error("Application not found");
    }
    await (0, rbac_1.requireOrgRole)(staffUserId, application.program.organizationId, ["org_admin"]);
    const updated = await client_1.prisma.$transaction(async (tx) => {
        const updatedApplication = await tx.programApplication.update({
            where: { id: applicationId },
            data: { assignedToId: assignToUserId }
        });
        await tx.applicationEvent.create({
            data: {
                applicationId,
                type: "assigned",
                actorId: staffUserId,
                metadata: { assignedTo: assignToUserId }
            }
        });
        return updatedApplication;
    });
    return updated;
}
async function addInternalNote(applicationId, staffUserId, note) {
    const application = await client_1.prisma.programApplication.findUnique({
        where: { id: applicationId },
        include: { program: true }
    });
    if (!application) {
        throw new Error("Application not found");
    }
    await (0, rbac_1.requireOrgRole)(staffUserId, application.program.organizationId, ["org_admin", "reviewer"]);
    const created = await client_1.prisma.applicationEvent.create({
        data: {
            applicationId,
            type: "note_added",
            actorId: staffUserId,
            metadata: { note }
        }
    });
    return created;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addApplicationToWaitlist = addApplicationToWaitlist;
exports.removeApplicationFromWaitlist = removeApplicationFromWaitlist;
exports.promoteNextWaitlistEntry = promoteNextWaitlistEntry;
const client_1 = require("@/lib/prisma/client");
const notification_service_1 = require("@/lib/notifications/notification.service");
async function addApplicationToWaitlist(applicationId, actorId, reason) {
    const application = await client_1.prisma.programApplication.findUnique({
        where: { id: applicationId },
        include: { program: true, user: true }
    });
    if (!application) {
        throw new Error("application_not_found");
    }
    const existing = await client_1.prisma.waitlistEntry.findUnique({ where: { applicationId } });
    if (existing && !existing.removedAt) {
        return existing;
    }
    const positionAggregate = await client_1.prisma.waitlistEntry.aggregate({
        where: { programId: application.programId, removedAt: null },
        _max: { position: true }
    });
    const position = (positionAggregate._max.position ?? 0) + 1;
    const waitlistEntry = await client_1.prisma.waitlistEntry.create({
        data: {
            programId: application.programId,
            applicationId,
            position,
            removedAt: null,
            promotedAt: null,
            removeReason: reason
        }
    });
    await client_1.prisma.applicationEvent.create({
        data: {
            applicationId,
            type: "waitlist_added",
            actorId: actorId ?? application.program.createdBy,
            metadata: {
                position,
                reason
            }
        }
    });
    await notification_service_1.notificationService.notify("application_waitlisted", {
        userId: application.userId,
        applicationId,
        programName: application.program.name,
        recipientEmail: application.user.email,
        locale: "en",
        reason,
        position
    });
    return waitlistEntry;
}
async function removeApplicationFromWaitlist(applicationId, actorId, reason) {
    const existing = await client_1.prisma.waitlistEntry.findUnique({ where: { applicationId }, include: { application: true } });
    if (!existing || existing.removedAt) {
        return null;
    }
    const updated = await client_1.prisma.waitlistEntry.update({
        where: { applicationId },
        data: {
            removedAt: new Date(),
            removeReason: reason
        }
    });
    await client_1.prisma.applicationEvent.create({
        data: {
            applicationId,
            type: "waitlist_removed",
            actorId: actorId ?? existing.application.userId,
            metadata: {
                reason
            }
        }
    });
    return updated;
}
async function promoteNextWaitlistEntry(programId, actorId) {
    const entry = await client_1.prisma.waitlistEntry.findFirst({
        where: { programId, removedAt: null, promotedAt: null },
        orderBy: [{ position: "asc" }, { joinedAt: "asc" }],
        include: { application: { include: { user: true, program: true } } }
    });
    if (!entry) {
        return null;
    }
    const promoted = await client_1.prisma.waitlistEntry.update({
        where: { applicationId: entry.applicationId },
        data: { promotedAt: new Date() }
    });
    await client_1.prisma.applicationEvent.create({
        data: {
            applicationId: entry.applicationId,
            type: "waitlist_promoted",
            actorId: actorId ?? entry.application.userId,
            metadata: {
                position: entry.position
            }
        }
    });
    await notification_service_1.notificationService.notify("admin_action", {
        userId: entry.application.userId,
        recipientEmail: entry.application.user.email,
        locale: "en",
        applicationId: entry.applicationId,
        programName: entry.application.program.name,
        eventName: "waitlist_promoted"
    });
    return promoted;
}

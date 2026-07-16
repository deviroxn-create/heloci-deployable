"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processDocumentRequestReminders = processDocumentRequestReminders;
exports.processProgramDeadlineNotifications = processProgramDeadlineNotifications;
const client_1 = require("@/lib/prisma/client");
const notification_service_1 = require("@/lib/notifications/notification.service");
async function processDocumentRequestReminders() {
    const threshold = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const requests = await client_1.prisma.documentRequest.findMany({
        where: {
            status: "pending",
            requestedAt: { lte: threshold },
            reminderSentAt: null
        },
        include: {
            application: {
                include: { user: true, program: true }
            }
        }
    });
    const processed = [];
    await Promise.all(requests.map(async (request) => {
        await client_1.prisma.documentRequest.update({
            where: { id: request.id },
            data: { reminderSentAt: new Date() }
        });
        await client_1.prisma.applicationEvent.create({
            data: {
                applicationId: request.applicationId,
                type: "document_reminder_sent",
                actorId: request.requestedBy,
                metadata: {
                    documentRequestId: request.id,
                    documentType: request.documentType
                }
            }
        });
        await notification_service_1.notificationService.notify("documents_requested", {
            userId: request.application.userId,
            applicationId: request.applicationId,
            programName: request.application.program.name,
            recipientEmail: request.application.user.email,
            locale: "en",
            documentType: request.documentType,
            requestedDocs: [request.documentType]
        });
        processed.push(request.id);
    }));
    return processed.length;
}
async function processProgramDeadlineNotifications() {
    const now = new Date();
    const upcoming = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const programs = await client_1.prisma.program.findMany({
        where: {
            deadline: {
                gte: now,
                lte: upcoming
            }
        }
    });
    const notified = [];
    await Promise.all(programs.map(async (program) => {
        await client_1.prisma.programEvent.create({
            data: {
                programId: program.id,
                type: "deadline_reminder",
                actorId: program.createdBy,
                metadata: {
                    deadline: program.deadline
                }
            }
        });
        await notification_service_1.notificationService.notify("admin_action", {
            userId: program.createdBy,
            recipientEmail: process.env.COMMUNICATION_SENDER_EMAIL || "support@heloci.ngo",
            locale: "en",
            programName: program.name,
            eventName: "deadline_reminder"
        });
        notified.push(program.id);
    }));
    return notified.length;
}

import { prisma } from "@/lib/prisma/client";
import { notificationService } from "@/lib/notifications/notification.service";
import { queueTelegramAlert } from "@/lib/telegram/alert-service";

export async function processDocumentRequestReminders() {
  const threshold = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const requests = await prisma.documentRequest.findMany({
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

  const processed: string[] = [];

  await Promise.all(
    requests.map(async (request) => {
      await prisma.documentRequest.update({
        where: { id: request.id },
        data: { reminderSentAt: new Date() }
      });

      await prisma.applicationEvent.create({
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

      await notificationService.notify("documents_requested", {
        userId: request.application.userId,
        applicationId: request.applicationId,
        programName: request.application.program.name,
        recipientEmail: request.application.user.email,
        locale: "en",
        documentType: request.documentType,
        requestedDocs: [request.documentType]
      });

      processed.push(request.id);
    })
  );

  return processed.length;
}

export async function processProgramDeadlineNotifications() {
  const now = new Date();
  const upcoming = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const programs = await prisma.program.findMany({
    where: {
      deadline: {
        gte: now,
        lte: upcoming
      }
    }
  });

  const notified: string[] = [];

  await Promise.all(
    programs.map(async (program) => {
      await prisma.programEvent.create({
        data: {
          programId: program.id,
          type: "deadline_reminder",
          actorId: program.createdBy,
          metadata: {
            deadline: program.deadline
          }
        }
      });

      await notificationService.notify("admin_action", {
        userId: program.createdBy,
        recipientEmail: process.env.COMMUNICATION_SENDER_EMAIL || "support@heloci.ngo",
        locale: "en",
        programName: program.name,
        eventName: "deadline_reminder"
      });

      await notificationService.notify("ops_alert", {
        userId: program.createdBy,
        programName: program.name,
        eventName: "deadline_reminder",
        locale: "en"
      });

      try {
        await queueTelegramAlert({ type: 'deadline_approaching', level: 'WARN', organizationId: program.organizationId ?? undefined, data: { programId: program.id, deadline: program.deadline, programName: program.name } });
      } catch (e) {
        console.error('deadline-service: queueTelegramAlert failed', e);
      }

      notified.push(program.id);
    })
  );

  return notified.length;
}

import { prisma } from "@/lib/prisma/client";
import { loadApplicantProfile } from "@/services/applicant-profile.service";
import { notificationService } from "@/lib/notifications/notification.service";
import { queueTelegramAlert } from "@/lib/telegram/alert-service";
import { requireOrgRole } from "@/lib/auth/rbac";

export async function getApplicationsForReview(orgId: string, filters: {
  staffUserId: string;
  status?: string[];
  assignedTo?: string;
  programId?: string;
  search?: string;
}) {
  await requireOrgRole(filters.staffUserId, orgId, ["org_admin", "reviewer", "viewer"]);

  const where: any = {
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

  const applications = await prisma.programApplication.findMany({
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

  const statusCounts = await prisma.programApplication.groupBy({
    by: ["status"],
    where,
    _count: { status: true }
  });

  return {
    applications,
    counts: statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>)
  };
}

export async function getApplicationDetail(applicationId: string, staffUserId: string) {
  const application = await prisma.programApplication.findUnique({
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

  await requireOrgRole(staffUserId, application.program.organizationId, ["org_admin", "reviewer", "viewer"]);

  const applicantProfile = await loadApplicantProfile(application.userId);
  const eligibilityResult = await prisma.eligibilityResult.findUnique({
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

export async function updateApplicationStatus(
  applicationId: string,
  staffUserId: string,
  action: "approve" | "reject" | "waitlist" | "request_info",
  data: { reason?: string; internalNote?: string; requestedDocs?: string[] }
) {
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: { program: true }
  });

  if (!application) {
    throw new Error("Application not found");
  }

  await requireOrgRole(staffUserId, application.program.organizationId, ["org_admin", "reviewer"]);

  const statusMap: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
    waitlist: "waitlisted",
    request_info: "more_info_requested"
  };

  const decision = statusMap[action];
  const previousStatus = application.status;

  const updated = await prisma.$transaction(async (tx) => {
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

    try {
      await queueTelegramAlert({
        type: 'status_changed',
        level: 'INFO',
        organizationId: application.program.organizationId ?? undefined,
        data: { applicationId, from: previousStatus, to: decision, actorName: staffUserId }
      });
    } catch (e) {
      console.error('queueTelegramAlert failed', e);
    }

    if (action === "request_info" && data.requestedDocs?.length) {
      await Promise.all(
        data.requestedDocs.map((documentType) =>
          tx.documentRequest.create({
            data: {
              applicationId,
              documentType,
              requestedBy: staffUserId,
              notes: data.reason
            }
          })
        )
      );
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

  const notifyEventMap: Record<string, string> = {
    approved: "application_approved",
    rejected: "application_rejected",
    waitlisted: "application_waitlisted",
    more_info_requested: "documents_requested"
  };

  const eventName = notifyEventMap[decision];

  if (eventName) {
    await notificationService.notify(eventName as any, {
      userId: application.userId,
      applicationId: application.id,
      programName: application.program.name,
      reason: data.reason,
      requestedDocs: data.requestedDocs,
      locale: "en"
    });

    await notificationService.notify("ops_alert", {
      userId: staffUserId,
      applicationId: application.id,
      programName: application.program.name,
      eventName: eventName,
      decision,
      reason: data.reason,
      locale: "en"
    });

    try {
        if (decision === 'approved') {
          await queueTelegramAlert({ type: 'approved', level: 'INFO', organizationId: application.program.organizationId ?? undefined, data: { applicationId: application.id, programName: application.program.name } });
        }
        if (decision === 'rejected') {
          await queueTelegramAlert({ type: 'rejected', level: 'WARN', organizationId: application.program.organizationId ?? undefined, data: { applicationId: application.id, reason: data.reason } });
        }
    } catch (e) {
      console.error('queueTelegramAlert failed', e);
    }
  }

  return updated;
}

export async function assignApplication(applicationId: string, staffUserId: string, assignToUserId: string) {
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: { program: true }
  });

  if (!application) {
    throw new Error("Application not found");
  }

  await requireOrgRole(staffUserId, application.program.organizationId, ["org_admin"]);

  const updated = await prisma.$transaction(async (tx) => {
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

    try {
      await queueTelegramAlert({
        type: 'review_assigned',
        level: 'INFO',
        organizationId: application.program.organizationId ?? undefined,
        data: { applicationId, reviewerName: assignToUserId }
      });
    } catch (e) {
      console.error('queueTelegramAlert failed', e);
    }

    return updatedApplication;
  });

  return updated;
}

export async function addInternalNote(applicationId: string, staffUserId: string, note: string) {
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: { program: true }
  });

  if (!application) {
    throw new Error("Application not found");
  }

  await requireOrgRole(staffUserId, application.program.organizationId, ["org_admin", "reviewer"]);

  const created = await prisma.applicationEvent.create({
    data: {
      applicationId,
      type: "note_added",
      actorId: staffUserId,
      metadata: { note }
    }
  });

  return created;
}

import { prisma } from "@/lib/prisma/client";
import { loadApplicantProfile } from "@/services/applicant-profile.service";
import { publishDomainEvent } from "@/lib/events/domain-event-publisher";
import { queueTelegramAlert } from "@/lib/telegram/alert-service";

export async function getApplicationsForReview(orgId: string, filters: {
  status?: string[];
  assignedTo?: string;
  programId?: string;
  search?: string;
}) {
  // Authorization is handled at API route level
  // This service performs only business logic validation

  const where: any = {
    program: { organizationId: orgId }
  };

  if (filters.status?.length) {
    where.status = { in: filters.status };
  }

  if (filters.assignedTo) {
    where.assignedToId = filters.assignedTo;
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

export async function getApplicationOrganizationId(applicationId: string) {
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    select: {
      program: {
        select: { organizationId: true }
      }
    }
  });

  return application?.program.organizationId ?? null;
}

export async function getApplicationDetail(applicationId: string) {
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

  // Authorization is handled at API route level
  // This service performs only business logic validation (ownership via program.organizationId)

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
  action: "approve" | "reject" | "waitlist" | "request_info",
  actorId: string,
  data: { reason?: string; internalNote?: string; requestedDocs?: string[] }
) {
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: { program: true }
  });

  if (!application) {
    throw new Error("Application not found");
  }

  // Authorization is handled at API route level
  // This service performs only business logic validation (workflow state changes)

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
        reviewedById: actorId,
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
        actorId: actorId,
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
        data: { applicationId, from: previousStatus, to: decision, actorName: actorId }
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
              requestedBy: actorId,
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
          actorId: actorId,
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
    const applicantEmail = updated.user?.email ?? application.userId;

    publishDomainEvent(eventName === "documents_requested" ? "documents.requested" : `application.${decision}`, {
      userId: application.userId,
      email: applicantEmail,
      applicationId: application.id,
      programName: application.program.name,
      reason: data.reason,
      requestedDocs: data.requestedDocs,
      actorId,
      decision,
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

export async function assignApplication(applicationId: string, assignToUserId: string, actorId: string) {
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: { program: true }
  });

  if (!application) {
    throw new Error("Application not found");
  }

  // Authorization is handled at API route level
  // This service performs only business logic validation (assignment logic)

  const updated = await prisma.$transaction(async (tx) => {
    const updatedApplication = await tx.programApplication.update({
      where: { id: applicationId },
      data: { assignedToId: assignToUserId }
    });

    await tx.applicationEvent.create({
      data: {
        applicationId,
        type: "assigned",
        actorId: actorId,
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

export async function addInternalNote(applicationId: string, note: string, actorId: string) {
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: { program: true }
  });

  if (!application) {
    throw new Error("Application not found");
  }

  // Authorization is handled at API route level
  // This service performs only business logic validation (note creation)

  const created = await prisma.applicationEvent.create({
    data: {
      applicationId,
      type: "note_added",
      actorId: actorId,
      metadata: { note }
    }
  });

  return created;
}

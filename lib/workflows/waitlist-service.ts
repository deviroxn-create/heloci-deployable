import { prisma } from "@/lib/prisma/client";
import { publishDomainEvent } from "@/lib/events/domain-event-publisher";

export async function addApplicationToWaitlist(applicationId: string, actorId?: string, reason?: string) {
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: { program: true, user: true }
  });

  if (!application) {
    throw new Error("application_not_found");
  }

  const existing = await prisma.waitlistEntry.findUnique({ where: { applicationId } });
  if (existing && !existing.removedAt) {
    return existing;
  }

  const positionAggregate = await prisma.waitlistEntry.aggregate({
    where: { programId: application.programId, removedAt: null },
    _max: { position: true }
  });

  const position = (positionAggregate._max.position ?? 0) + 1;

  const waitlistEntry = await prisma.waitlistEntry.create({
    data: {
      programId: application.programId,
      applicationId,
      position,
      removedAt: null,
      promotedAt: null,
      removeReason: reason
    }
  });

  await prisma.applicationEvent.create({
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

  publishDomainEvent("application.waitlisted", {
    userId: application.userId,
    applicationId,
    programName: application.program.name,
    recipientEmail: application.user.email,
    locale: "en",
    reason,
    position,
  });

  return waitlistEntry;
}

export async function removeApplicationFromWaitlist(applicationId: string, actorId?: string, reason?: string) {
  const existing = await prisma.waitlistEntry.findUnique({ where: { applicationId }, include: { application: true } });
  if (!existing || existing.removedAt) {
    return null;
  }

  const updated = await prisma.waitlistEntry.update({
    where: { applicationId },
    data: {
      removedAt: new Date(),
      removeReason: reason
    }
  });

  await prisma.applicationEvent.create({
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

export async function promoteNextWaitlistEntry(programId: string, actorId?: string) {
  const entry = await prisma.waitlistEntry.findFirst({
    where: { programId, removedAt: null, promotedAt: null },
    orderBy: [{ position: "asc" }, { joinedAt: "asc" }],
    include: { application: { include: { user: true, program: true } } }
  });

  if (!entry) {
    return null;
  }

  const promoted = await prisma.waitlistEntry.update({
    where: { applicationId: entry.applicationId },
    data: { promotedAt: new Date() }
  });

  await prisma.applicationEvent.create({
    data: {
      applicationId: entry.applicationId,
      type: "waitlist_promoted",
      actorId: actorId ?? entry.application.userId,
      metadata: {
        position: entry.position
      }
    }
  });

  publishDomainEvent("admin.action", {
    userId: entry.application.userId,
    recipientEmail: entry.application.user.email,
    locale: "en",
    applicationId: entry.applicationId,
    programName: entry.application.program.name,
    eventName: "waitlist_promoted",
  });

  return promoted;
}

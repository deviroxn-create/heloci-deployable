import { prisma } from "@/lib/prisma/client";

export async function getApplicationForCompose(applicationId: string) {
  return prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: {
      user: { select: { email: true, name: true } },
      program: { select: { name: true, organizationId: true } }
    }
  });
}

export async function getTemplateForApplicationStatus(status: string) {
  return prisma.notificationTemplate.findFirst({
    where: {
      eventName: {
        in: getEventNameForStatus(status)
      },
      channel: "email",
      status: "PUBLISHED"
    },
    select: { id: true }
  });
}

function getEventNameForStatus(status: string): string[] {
  const eventMap: Record<string, string[]> = {
    approved: ["application_approved"],
    rejected: ["application_rejected"],
    waitlisted: ["application_waitlisted"],
    more_info_requested: ["documents_requested"],
    under_review: ["application_under_review"],
    pending: []
  };
  return eventMap[status] || [];
}

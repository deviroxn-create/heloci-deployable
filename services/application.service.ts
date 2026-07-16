import { ApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

export async function listApplications(userId: string) {
  return prisma.application.findMany({ where: { applicantId: userId }, include: { property: true } });
}

export async function getApplication(id: string) {
  return prisma.application.findUnique({ where: { id }, include: { property: true, documents: true } });
}

export async function createApplication(applicantId: string, programSlug: string, programName: string) {
  return prisma.application.create({
    data: {
      applicantId,
      status: ApplicationStatus.PENDING,
      notes: `Application created for program: ${programName} (${programSlug})`,
    },
  });
}

import { ApplicationStatus } from "@prisma/client";
import { prisma } from "../lib/prisma/client";

export async function listApplications(userId: string) {
  return prisma.application.findMany({ where: { applicantId: userId }, include: { property: true } });
}

export async function getApplication(id: string) {
  return prisma.application.findUnique({ where: { id }, include: { property: true, documents: true } });
}

export function assertApplicationCreationInput(applicantId: string, programId: string, programName: string) {
  if (!applicantId?.trim()) {
    throw new Error("Applicant required");
  }

  if (!programId?.trim()) {
    throw new Error("Program required");
  }

  if (!programName?.trim()) {
    throw new Error("Program name required");
  }
}

export async function createApplication(applicantId: string, programId: string, programName: string) {
  assertApplicationCreationInput(applicantId, programId, programName);

  return prisma.application.create({
    data: {
      applicantId,
      status: ApplicationStatus.PENDING,
      notes: `Application created for program: ${programName} (${programId})`,
    },
  });
}

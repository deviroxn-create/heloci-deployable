import { prisma } from "@/lib/prisma/client";
import { getPropertyEntryReadiness } from "./admin-property.service";

export interface ProgramPropertyInput {
  propertyId: string;
  availableFrom?: string | null;
  availableUntil?: string | null;
  isActive?: boolean;
}

const programPropertyInclude = {
  property: {
    select: {
      id: true,
      externalId: true,
      title: true,
      city: true,
      state: true,
      status: true,
      availabilityCount: true
    }
  }
} as const;

function parseDate(value: string | null | undefined, field: string) {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${field} must be a valid date`);
  return date;
}

function parseAvailabilityDates(input: Pick<ProgramPropertyInput, "availableFrom" | "availableUntil">) {
  const availableFrom = parseDate(input.availableFrom, "availableFrom");
  const availableUntil = parseDate(input.availableUntil, "availableUntil");
  if (availableFrom && availableUntil && availableUntil < availableFrom) {
    throw new Error("availableUntil must be on or after availableFrom");
  }
  return { availableFrom, availableUntil };
}

export function assertActiveAssignmentReadiness(
  readiness: Awaited<ReturnType<typeof getPropertyEntryReadiness>>,
  isActive: boolean
) {
  if (isActive && (!readiness.readyForProgramAssignment || readiness.status !== "AVAILABLE")) {
    throw new Error("PROPERTY_NOT_READY_FOR_ACTIVE_ASSIGNMENT");
  }
}

async function getProgramForOrganization(programId: string, organizationId: string) {
  const program = await prisma.program.findFirst({
    where: { id: programId, organizationId },
    select: { id: true, organizationId: true, name: true }
  });
  if (!program) throw new Error("PROGRAM_NOT_FOUND");
  return program;
}

export async function listProgramProperties(programId: string, organizationId: string) {
  await getProgramForOrganization(programId, organizationId);
  return prisma.programProperty.findMany({
    where: { programId, organizationId },
    include: programPropertyInclude,
    orderBy: { createdAt: "desc" }
  });
}

export async function assignPropertyToProgram(
  programId: string,
  organizationId: string,
  input: ProgramPropertyInput
) {
  if (!input.propertyId || typeof input.propertyId !== "string") {
    throw new Error("propertyId is required");
  }

  await getProgramForOrganization(programId, organizationId);
  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, organizationId },
    select: { id: true }
  });
  if (!property) {
    throw new Error("PROPERTY_NOT_FOUND_OR_UNASSIGNED");
  }

  const isActive = input.isActive ?? true;
  if (isActive) {
    const readiness = await getPropertyEntryReadiness(organizationId, input.propertyId);
    assertActiveAssignmentReadiness(readiness, isActive);
  }

  const dates = parseAvailabilityDates(input);
  return prisma.programProperty.upsert({
    where: { programId_propertyId: { programId, propertyId: input.propertyId } },
    create: {
      organizationId,
      programId,
      propertyId: input.propertyId,
      isActive,
      ...dates
    },
    update: {
      isActive,
      ...dates
    },
    include: programPropertyInclude
  });
}

export async function updateProgramProperty(
  programId: string,
  programPropertyId: string,
  organizationId: string,
  input: Pick<ProgramPropertyInput, "availableFrom" | "availableUntil" | "isActive">
) {
  await getProgramForOrganization(programId, organizationId);
  const assignment = await prisma.programProperty.findFirst({
    where: { id: programPropertyId, programId, organizationId }
  });
  if (!assignment) throw new Error("PROGRAM_PROPERTY_NOT_FOUND");

  if (input.isActive === true) {
    const readiness = await getPropertyEntryReadiness(organizationId, assignment.propertyId);
    assertActiveAssignmentReadiness(readiness, true);
  }

  const dates = parseAvailabilityDates(input);
  return prisma.programProperty.update({
    where: { id: programPropertyId },
    data: {
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
      ...dates
    },
    include: programPropertyInclude
  });
}
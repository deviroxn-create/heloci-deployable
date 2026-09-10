import { prisma } from "@/lib/prisma/client";

const APPROVED_STATUS = "approved";
const INTERESTED_STATUS = "INTERESTED";
const WITHDRAWN_STATUS = "WITHDRAWN";
const AVAILABLE_STATUS = "AVAILABLE";

class ApplicantPropertyInterestError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "FORBIDDEN" | "UNAVAILABLE", message: string) {
    super(message);
  }
}

type ApplicationSelection = {
  id: string;
  userId: string;
  status: string;
  program: { id: string; organizationId: string };
};

type ProgramPropertySelection = {
  id: string;
  programId: string;
  organizationId: string;
  isActive: boolean;
  availableFrom: Date | null;
  availableUntil: Date | null;
  property: {
    status: string;
    units: Array<{ id: string }>;
  };
};

export function assertApplicationMatchesProgramProperty(
  userId: string,
  application: ApplicationSelection | null,
  programProperty: Pick<ProgramPropertySelection, "programId" | "organizationId">
): asserts application is ApplicationSelection {
  if (
    !application ||
    application.userId !== userId ||
    application.status !== APPROVED_STATUS ||
    application.program.id !== programProperty.programId ||
    application.program.organizationId !== programProperty.organizationId
  ) {
    throw new ApplicantPropertyInterestError("FORBIDDEN", "An approved application is required.");
  }
}

async function getAuthorizedApplication(userId: string, applicationId: string, programPropertyId: string) {
  const programProperty = await prisma.programProperty.findUnique({
    where: { id: programPropertyId },
    select: {
      id: true,
      organizationId: true,
      programId: true,
      isActive: true,
      availableFrom: true,
      availableUntil: true,
      property: {
        select: {
          status: true,
          units: { where: { available: true }, select: { id: true } }
        }
      }
    }
  });

  if (!programProperty) {
    throw new ApplicantPropertyInterestError("NOT_FOUND", "Property availability was not found.");
  }

  const application = await prisma.programApplication.findFirst({
    where: {
      id: applicationId,
      userId,
      status: APPROVED_STATUS
    },
    select: {
      id: true,
      userId: true,
      status: true,
      program: { select: { id: true, organizationId: true } }
    }
  });

  assertApplicationMatchesProgramProperty(userId, application, programProperty);

  return { application, programProperty };
}

function assertCurrentlyAvailable(programProperty: Awaited<ReturnType<typeof getAuthorizedApplication>>["programProperty"]) {
  const now = new Date();
  const dateAvailable =
    (!programProperty.availableFrom || programProperty.availableFrom <= now) &&
    (!programProperty.availableUntil || programProperty.availableUntil >= now);

  if (
    !programProperty.isActive ||
    !dateAvailable ||
    programProperty.property.status !== AVAILABLE_STATUS ||
    programProperty.property.units.length === 0
  ) {
    throw new ApplicantPropertyInterestError("UNAVAILABLE", "This property is not currently available.");
  }
}

export async function expressApplicantPropertyInterest(userId: string, applicationId: string, programPropertyId: string) {
  const { application, programProperty } = await getAuthorizedApplication(userId, applicationId, programPropertyId);
  assertCurrentlyAvailable(programProperty);

  return prisma.applicantPropertyInterest.upsert({
    where: {
      programApplicationId_programPropertyId: {
        programApplicationId: application.id,
        programPropertyId
      }
    },
    create: {
      programApplicationId: application.id,
      programPropertyId,
      status: INTERESTED_STATUS
    },
    update: { status: INTERESTED_STATUS }
  });
}

export async function withdrawApplicantPropertyInterest(userId: string, applicationId: string, programPropertyId: string) {
  const { application } = await getAuthorizedApplication(userId, applicationId, programPropertyId);

  await prisma.applicantPropertyInterest.updateMany({
    where: {
      programPropertyId,
      programApplicationId: application.id
    },
    data: { status: WITHDRAWN_STATUS }
  });
}

export async function getApplicantPropertyInterest(userId: string, applicationId: string, programPropertyId: string) {
  const { application } = await getAuthorizedApplication(userId, applicationId, programPropertyId);
  return prisma.applicantPropertyInterest.findUnique({
    where: {
      programApplicationId_programPropertyId: {
        programApplicationId: application.id,
        programPropertyId
      }
    },
    select: { id: true, status: true, createdAt: true, updatedAt: true },
  });
}

export { ApplicantPropertyInterestError };
import { prisma } from "@/lib/prisma/client";
import { getFormForProgram } from "@/lib/forms/renderer";
import { validatePage } from "@/lib/forms/validator";
import { publishDomainEvent } from "@/lib/events/domain-event-publisher";
import { getMissingApplicantDocuments } from "@/lib/documents/applicant-requirements";
import { APPLICANT_IDENTITY_DOCUMENTS } from "@/lib/documents/categories";
import { sanitizeApplicationData } from "@/lib/notifications/application-telegram-summary";

export { sanitizeApplicationData } from "@/lib/notifications/application-telegram-summary";

export class ApplicationValidationError extends Error {
  constructor(public readonly errors: Record<string, string>) {
    super("Validation failed");
    this.name = "ApplicationValidationError";
  }
}

export async function listApplicationsForUser(userId: string) {
  return prisma.programApplication.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      program: {
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          housingGoal: true,
          organization: { select: { name: true } },
        },
      },
      documentRequests: {
        select: {
          id: true,
          documentType: true,
          status: true,
          requestedAt: true,
          submittedAt: true,
          fileUrl: true,
        },
        orderBy: { requestedAt: "desc" },
      },
    },
  });
}

export async function saveApplicationDraft(input: {
  applicationId: string;
  userId: string;
  pageData?: Record<string, unknown> | null;
  currentPage?: number | null;
}) {
  const application = await prisma.programApplication.findUnique({
    where: { id: input.applicationId },
    select: {
      id: true,
      userId: true,
      status: true,
      data: true,
      currentPage: true,
    },
  });

  if (!application || application.userId !== input.userId) {
    throw new Error("Application not found.");
  }

  if (application.status !== "draft") {
    throw new Error("Only draft applications can be saved.");
  }

  const existingData =
    application.data && typeof application.data === "object" && application.data !== null
      ? (application.data as Record<string, unknown>)
      : {};

  const mergedData = { ...existingData, ...(input.pageData ?? {}) } as Record<string, unknown>;

  return prisma.programApplication.update({
    where: { id: input.applicationId },
    data: {
      data: mergedData as any,
      currentPage: input.currentPage ?? application.currentPage ?? 0,
    },
  });
}

function transformWizardToQuestionSet(wizardData: Record<string, unknown>): Record<string, unknown> {
  const KEY_MAPPING: Record<string, string> = {
    "housing.state": "state",
    "housing.zipCode": "zipCode",
    "housing.city": "city",
    "housing.county": "county",
    "housing.currentAddress": "currentAddress",
    "housing.currentHousingSituation": "currentHousing",
    "housing.ownOrRent": "ownOrRent",
    "housing.monthlyRent": "monthlyRent",
    "housing.lengthOfResidence": "lengthOfResidence",
    "housing.facingEviction": "riskOfEviction",
    "housing.wasHomeless": "wasHomeless",
    "housing.priorEviction": "priorEviction",
    "housing.housingGoals": "housingGoals",
    "income.incomeRange": "incomeRange",
    "income.monthlyIncome": "monthlyIncome",
    "income.annualIncome": "annualIncome",
    "income.sources": "incomeSources",
    "household.householdSize": "householdSize",
    "household.type": "householdType",
    "household.adults": "adults",
    "household.children": "children",
    "household.elderlyMembers": "elderlyMembers",
    "household.disabledMembers": "disabledMembers",
    "personal.isVeteran": "isVeteran",
    "personal.isDisabilityAffected": "hasDisability",
    "personal.isSenior": "isSenior",
    "personal.isStudent": "isStudent",
    "personal.isPublicWorker": "isPublicWorker",
    "personal.firstName": "firstName",
    "personal.lastName": "lastName",
    "personal.email": "email",
    "personal.phone": "phone",
    "personal.dateOfBirth": "dateOfBirth",
    "personal.citizenshipStatus": "citizenshipStatus",
    "employment.status": "employmentStatus",
    "employment.employerName": "employerName",
    "employment.occupation": "occupation",
    "financial.assets": "assets",
    "financial.checkingBalance": "checkingBalance",
    "financial.savingsBalance": "savingsBalance",
    "financial.ownsProperty": "ownsProperty",
    "financial.ownsVehicle": "ownsVehicle",
    "banking.bankName": "bankName",
    "banking.accountType": "accountType",
    "banking.routingNumber": "routingNumber",
    "banking.directDeposit": "directDeposit",
  };

  const transformed: Record<string, unknown> = {};

  // Accept both the wizard's flat keys and nested saved profile/draft data.
  const nestedHousing = wizardData.housing;
  const housing = nestedHousing && typeof nestedHousing === "object"
    ? nestedHousing as Record<string, unknown>
    : {};
  const normalizedWizardData: Record<string, unknown> = {
    ...wizardData,
    ...(wizardData["housing.state"] === undefined && housing.state !== undefined
      ? { "housing.state": housing.state }
      : {}),
  };

  for (const [wizardKey, value] of Object.entries(normalizedWizardData)) {
    if (KEY_MAPPING[wizardKey]) {
      const questionSetKey = KEY_MAPPING[wizardKey];
      let normalizedValue = value;
      if (typeof value === "number") {
        normalizedValue = String(value);
      }
      // Convert booleans to strings for boolean field validation
      if (typeof value === "boolean") {
        normalizedValue = String(value);  // true → "true", false → "false"
      }
      transformed[questionSetKey] = normalizedValue;
      transformed[wizardKey] = value;
    } else if (!wizardKey.includes(".")) {
      const hasNamespacedVersion = Object.entries(KEY_MAPPING).some(
        ([namespacedKey, questionSetKey]) => questionSetKey === wizardKey && normalizedWizardData[namespacedKey] !== undefined
      );
      if (!hasNamespacedVersion) {
        transformed[wizardKey] = value;
      }
    } else {
      transformed[wizardKey] = value;
    }
  }

  if (!transformed.isSenior) {
    const elderlyMembers = transformed.elderlyMembers || transformed["household.elderlyMembers"];
    transformed.isSenior = elderlyMembers && Number(elderlyMembers) > 0 ? "true" : "false";
  }

  if (!transformed.isStudent) {
    transformed.isStudent = "false";
  }

  // Remove confirmation fields from stored data (they are validation-only)
  delete transformed["personal.ssnConfirm"];
  delete transformed["banking.accountNumber"];
  delete transformed["banking.accountNumberConfirm"];
  delete transformed["banking.accountConfirm"];

  return transformed;
}

export function buildApplicationSubmittedNotificationPayload(input: {
  userId: string;
  recipientId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  programId?: string | null;
  organizationId?: string | null;
  applicationId: string;
}) {
  return {
    userId: input.userId,
    recipientId: input.recipientId ?? input.userId,
    userEmail: input.userEmail ?? undefined,
    recipientEmail: input.userEmail ?? undefined,
    name: input.userName ?? undefined,
    programId: input.programId ?? undefined,
    organizationId: input.organizationId ?? undefined,
    applicationId: input.applicationId,
  };
}

export async function submitApplication(input: {
  applicationId: string;
  userId: string;
  wizardPayload: Record<string, unknown>;
}) {
  const application = await prisma.programApplication.findUnique({
    where: { id: input.applicationId },
    select: {
      id: true,
      userId: true,
      programId: true,
      data: true,
      status: true,
      submittedAt: true,
      documents: { select: { type: true } },
    },
  });

  if (!application || application.userId !== input.userId) {
    throw new Error("Application not found.");
  }

  const program = await prisma.program.findUnique({
    where: { id: application.programId },
    select: { slug: true, name: true, organizationId: true },
  });

  const questionSetPayload = transformWizardToQuestionSet(input.wizardPayload);

  const missingDocuments = getMissingApplicantDocuments({
    identityType: typeof input.wizardPayload["documents.identityType"] === "string"
      ? input.wizardPayload["documents.identityType"] as "national_id" | "visa" | "drivers_license"
      : undefined,
    uploads: application.documents,
  });
  if (missingDocuments.length > 0) {
    throw new ApplicationValidationError({ documents: missingDocuments.join(" ") });
  }
  
  // CUSTOM VALIDATION: SSN Confirmation must match
  const ssnValue = input.wizardPayload["personal.ssn"];
  const ssnConfirmValue = input.wizardPayload["personal.ssnConfirm"];
  
  if (ssnValue && ssnConfirmValue && ssnValue !== ssnConfirmValue) {
    throw new Error("Social Security Numbers do not match. Please verify and re-enter.");
  }
  
  // CUSTOM VALIDATION: Phone numbers must be valid 10-digit US format if provided
  const phoneValue = input.wizardPayload["personal.phone"];
  if (phoneValue && String(phoneValue).replace(/\D/g, '').length !== 10) {
    throw new Error("Primary phone number must be a valid 10-digit US phone number.");
  }
  
  const secondaryPhoneValue = input.wizardPayload["personal.secondaryPhone"];
  if (secondaryPhoneValue && String(secondaryPhoneValue).replace(/\D/g, '').length !== 10 && String(secondaryPhoneValue).trim() !== "") {
    throw new Error("Secondary phone number must be a valid 10-digit US phone number.");
  }
  
  // CUSTOM VALIDATION: Landlord phone must be valid if provided
  const landlordPhoneValue = input.wizardPayload["housing.landlordPhone"];
  if (landlordPhoneValue && String(landlordPhoneValue).trim() !== '' && String(landlordPhoneValue).replace(/\D/g, '').length !== 10) {
    throw new Error("Landlord phone number must be a valid 10-digit US phone number.");
  }
  
  // CUSTOM VALIDATION: DOB cannot be in future or represent someone younger than 15
  const dobValue = input.wizardPayload["personal.dateOfBirth"];
  if (dobValue) {
    const dob = new Date(String(dobValue));
    const today = new Date();
    
    if (dob > today) {
      throw new Error("Date of birth cannot be in the future.");
    }
    
    const age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 15) {
      throw new Error("Applicant must be at least 15 years old.");
    }
  }
  
  const form = await getFormForProgram(program?.slug ?? "", input.userId);
  const allQuestions = (form.pages ?? []).flatMap((page: any) => page.questions);
  
  const validation = validatePage(allQuestions, questionSetPayload);
  
  if (!validation.valid) {
    throw new ApplicationValidationError(validation.errors);
  }

  await prisma.programApplication.update({
    where: { id: application.id },
    data: {
      status: "submitted",
      submittedAt: new Date(),
      data: {
        ...((application.data && typeof application.data === "object" ? application.data : {}) as Record<string, unknown>),
        ...questionSetPayload,
      } as any,
    },
  });

  let userEmail: string | undefined;
  let userName: string | undefined;

  try {
    const user = await prisma.user.findUnique({
      where: { id: application.userId },  // ← Application OWNER (not current user)
      select: { id: true, name: true, email: true },
    });

    userEmail = user?.email ?? undefined;
    userName = user?.name ?? undefined;
  } catch (error) {
    console.error("Failed to load application user for notifications", error);
  }

  if (!userEmail) {
    console.error("Application submitted notification skipped: applicant email unavailable", {
      applicationId: application.id,
      userId: input.userId,
      organizationId: program?.organizationId
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, name: true, email: true },
    });

    const appData = questionSetPayload as Record<string, unknown>;
    const uploadedTypes = new Set(application.documents.map((document) => document.type));
    const identityType = typeof input.wizardPayload["documents.identityType"] === "string"
      ? input.wizardPayload["documents.identityType"]
      : undefined;
    const identity = identityType && identityType in APPLICANT_IDENTITY_DOCUMENTS
      ? APPLICANT_IDENTITY_DOCUMENTS[identityType as keyof typeof APPLICANT_IDENTITY_DOCUMENTS]
      : undefined;
    const ssnDigits = String(input.wizardPayload["personal.ssn"] ?? "").replace(/\D/g, "");
    const summary = {
      applicationId: application.id,
      programName: program?.name,
      applicantName: user?.name,
      applicantEmail: user?.email,
      status: "submitted",
      submittedAt: new Date().toISOString(),
      personal: {
        name: `${appData.firstName || ""} ${appData.lastName || ""}`.trim(),
        phone: appData.phone,
        email: appData.email,
        dateOfBirth: appData.dateOfBirth,
        citizenship: appData.citizenshipStatus,
        isVeteran: appData.isVeteran,
        hasDisability: appData.hasDisability,
        isSenior: appData.isSenior,
      },
      household: {
        type: appData.householdType,
        size: appData.householdSize,
        adults: appData.adults,
        children: appData.children,
        elderlyMembers: appData.elderlyMembers,
        disabledMembers: appData.disabledMembers,
      },
      employment: {
        status: appData.employmentStatus,
        employer: appData.employerName,
        occupation: appData.occupation,
        isTeacher: appData["employment.isTeacher"],
        isHealthcareWorker: appData["employment.isHealthcareWorker"],
      },
      income: {
        range: appData.incomeRange,
        monthly: appData.monthlyIncome,
        annual: appData.annualIncome,
        sources: appData.incomeSources,
      },
      housing: {
        currentSituation: appData.currentHousingSituation,
        city: appData.city,
        state: appData.state,
        zipCode: appData.zipCode,
        facingEviction: appData.riskOfEviction,
        priorEviction: appData.priorEviction,
      },
      financial: {
        assets: appData.assets,
      },
      banking: {
        routingNumber: appData.routingNumber ? "Provided" : "Not provided",
        directDeposit: appData["banking.prefersDirectDeposit"],
      },
      documents: {
        identity: identity
          ? `${identity.label} - Front ${uploadedTypes.has(identity.frontId) ? "provided" : "missing"} - Back ${uploadedTypes.has(identity.backId) ? "provided" : "missing"}`
          : "Not selected",
        utilityBill: uploadedTypes.has("utility_bill") ? "Provided - Optional" : "Not provided - Optional",
        income: uploadedTypes.has("w2") ? "W-2 - Optional" : uploadedTypes.has("ein_documentation") ? "EIN documentation - Optional" : "Not provided - Optional",
      },
      sensitive: {
        ssn: ssnDigits.length >= 4 ? `***-**-${ssnDigits.slice(-4)}` : "Not provided",
        routingNumber: appData.routingNumber ? "Provided" : "Not provided",
      },
      applicationData: Object.entries(sanitizeApplicationData(questionSetPayload) as Record<string, unknown>)
        .filter(([key]) => !key.toLowerCase().includes("fileurl") && !key.toLowerCase().includes("token"))
        .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value ?? "Not provided")}`)
        .join("\n"),
    };

    if (userEmail) {
      publishDomainEvent("application.submitted", {
        userId: application.userId,
        email: userEmail,
        name: userName,
        programId: application.programId,
        organizationId: program?.organizationId ?? undefined,
        ...summary,
      });
    }
  } catch (error) {
    console.error("Application submitted notification failed", error);
  }

  return { success: true };
}

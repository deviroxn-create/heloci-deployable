import { prisma } from "@/lib/prisma/client";
import { getFormForProgram } from "@/lib/forms/renderer";
import { validatePage } from "@/lib/forms/validator";
import { publishDomainEvent } from "@/lib/events/domain-event-publisher";
import { queueTelegramAlert } from "@/lib/telegram/alert-service";

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
    "banking.accountNumber": "accountNumber",
    "banking.directDeposit": "directDeposit",
  };

  const transformed: Record<string, unknown> = {};

  for (const [wizardKey, value] of Object.entries(wizardData)) {
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
      const hasNamespacedVersion = Object.values(KEY_MAPPING).includes(wizardKey);
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
  
  // STEP 3: Transformation (BEFORE & AFTER)
  console.log("\nSTEP 3: Transformation (Wizard → QuestionSet)");
  console.log("  BEFORE (Wizard):");
  const wizardKeys = Object.keys(input.wizardPayload);
  console.log(`    Total keys: ${wizardKeys.length}`);
  wizardKeys.forEach(k => {
    const v = input.wizardPayload[k];
    console.log(`    ${k}: ${JSON.stringify(v).substring(0, 40)} (${typeof v})`);
  });
  
  console.log("  AFTER (QuestionSet):");
  const questionSetKeys = Object.keys(questionSetPayload);
  console.log(`    Total keys: ${questionSetKeys.length}`);
  questionSetKeys.forEach(k => {
    const v = questionSetPayload[k];
    console.log(`    ${k}: ${JSON.stringify(v).substring(0, 40)} (${typeof v})`);
  });
  
  console.log("\n  Key Mapping Analysis:");
  const droppedKeys = wizardKeys.filter(k => !questionSetKeys.includes(k) && !questionSetKeys.includes(k.split('.')[1]));
  if (droppedKeys.length > 0) {
    console.log(`    Dropped keys: ${droppedKeys.slice(0, 10).join(', ')}`);
  }
  
  const form = await getFormForProgram(program?.slug ?? "", input.userId);
  const allQuestions = (form.pages ?? []).flatMap((page: any) => page.questions);
  
  // STEP 4: Question Set
  console.log("\nSTEP 4: Question Set (From getFormForProgram)");
  console.log(`  Program: ${program?.slug}`);
  console.log(`  Total Questions: ${allQuestions.length}`);
  allQuestions.forEach(q => {
    console.log(`    ${q.key}: Required=${q.required} Type=${q.type}`);
  });
  
  const validation = validatePage(allQuestions, questionSetPayload);

  // STEP 5: Validator
  console.log("\nSTEP 5: Validator Input & Result");
  console.log(`  Payload Keys: ${Object.keys(questionSetPayload).join(', ')}`);
  console.log(`  Schema Keys: ${allQuestions.map(q => q.key).join(', ')}`);
  
  if (!validation.valid) {
    console.log(`  Validation Result: FAILED`);
    console.log(`  Errors:`);
    for (const [field, error] of Object.entries(validation.errors)) {
      const value = questionSetPayload[field];
      console.log(`    Field: ${field}`);
      console.log(`    Expected: ${allQuestions.find(q => q.key === field)?.required ? 'REQUIRED' : 'OPTIONAL'}`);
      console.log(`    Received: ${value !== undefined ? JSON.stringify(value) : 'MISSING'}`);
      console.log(`    Message: ${error}`);
    }
    throw new Error("Validation failed");
  } else {
    console.log(`  Validation Result: PASSED`);
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

  if (userEmail) {
    console.log("📬 [Notification] Application submitted event publishing:", {
      actor: { id: input.userId, name: "current_user" },
      application: { id: application.id, ownerId: application.userId },
      recipient: { userId: application.userId, email: userEmail, name: userName },
      template: "application.submitted",
      organizationId: program?.organizationId
    });
    
    publishDomainEvent("application.submitted", {
      userId: application.userId,        // ← Application owner's ID (not current user)
      email: userEmail,
      name: userName,
      applicationId: application.id,
      programId: application.programId,
      organizationId: program?.organizationId ?? undefined,
    });
  } else {
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
    const summary = {
      applicationId: application.id,
      programName: program?.name,
      applicantName: user?.name,
      applicantEmail: user?.email,
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
        checkingBalance: appData.checkingBalance,
        savingsBalance: appData.savingsBalance,
      },
      banking: {
        bankName: appData.bankName,
        accountType: appData.accountType,
        directDeposit: appData["banking.prefersDirectDeposit"],
      },
    };

    await queueTelegramAlert({
      type: "submitted",
      level: "INFO",
      organizationId: program?.organizationId ?? undefined,
      data: summary,
    });
  } catch (error) {
    console.error("queueTelegramAlert failed", error);
  }

  return { success: true };
}

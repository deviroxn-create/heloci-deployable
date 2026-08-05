import { z } from "zod";

const booleanString = z.enum(["true", "false"]).transform((value) => value === "true");
const stringArray = z.array(z.string());

function coerceBooleanString(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return undefined;
}

function coerceNumberString(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const numeric = value.trim();
    if (/^[0-9]+$/.test(numeric)) return Number(numeric);
  }
  return undefined;
}

function normalizeStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return undefined;
}

function mapFlatFormValues(raw: Record<string, unknown>): Record<string, unknown> {
  const profile: Record<string, unknown> = {
    personal: { ...(raw.personal as Record<string, unknown> | undefined) },
    household: { ...(raw.household as Record<string, unknown> | undefined) },
    income: { ...(raw.income as Record<string, unknown> | undefined) },
    education: { ...(raw.education as Record<string, unknown> | undefined) },
    housing: { ...(raw.housing as Record<string, unknown> | undefined) },
    preferences: { ...(raw.preferences as Record<string, unknown> | undefined) },
    meta: { ...(raw.meta as Record<string, unknown> | undefined) }
  };

  const answers: Record<string, unknown> = {
    ...((profile.meta as Record<string, unknown> | undefined)?.answers as Record<string, unknown> | undefined)
  };

  if (raw.income !== undefined) {
    if (raw.income === null) {
      profile.income = null;
    } else if (typeof raw.income === "string") {
      profile.income = raw.income === "prefer_not_to_say" ? null : { incomeRange: raw.income };
    } else if (typeof raw.income === "object") {
      profile.income = { ...(raw.income as Record<string, unknown>) };
    }
  }

  if (typeof raw.incomeRange === "string") {
    answers.incomeRange = raw.incomeRange;
  }
  if (raw.householdSize !== undefined) {
    const parsed = coerceNumberString(raw.householdSize);
    if (parsed !== undefined) {
      (profile.household as Record<string, unknown>).householdSize = parsed;
    } else if (typeof raw.householdSize === "string") {
      answers.householdSize = raw.householdSize;
    }
  }
  if (typeof raw.state === "string") {
    answers.state = raw.state;
  }
  if (typeof raw.zipCode === "string") {
    answers.zipCode = raw.zipCode;
  }
  if (typeof raw.currentHousing === "string") {
    (profile.housing as Record<string, unknown>).currentHousingSituation = raw.currentHousing;
  }
  if (raw.housingGoals !== undefined) {
    answers.housingGoals = normalizeStringArray(raw.housingGoals);
    if (!((profile.preferences as Record<string, unknown>).housingGoal)) {
      const goals = normalizeStringArray(raw.housingGoals);
      if (goals && goals.length > 0) {
        (profile.preferences as Record<string, unknown>).housingGoal = goals.join(", ");
      }
    }
  }
  if (raw.riskOfEviction !== undefined) {
    answers.riskOfEviction = coerceBooleanString(raw.riskOfEviction);
  }
  if (raw.isVeteran !== undefined) {
    const value = coerceBooleanString(raw.isVeteran);
    if (value !== undefined) {
      (profile.personal as Record<string, unknown>).isVeteran = value;
    }
  }
  if (raw.hasDisability !== undefined) {
    const value = coerceBooleanString(raw.hasDisability);
    if (value !== undefined) {
      (profile.personal as Record<string, unknown>).isDisabilityAffected = value;
    }
  }
  if (raw.isSenior !== undefined) {
    answers.isSenior = coerceBooleanString(raw.isSenior);
  }
  if (raw.isStudent !== undefined) {
    answers.isStudent = coerceBooleanString(raw.isStudent);
  }

  if (Object.keys(answers).length > 0) {
    (profile.meta as Record<string, unknown>).answers = answers;
  }

  return profile;
}

const applicantProfileShape = z.object({
  personal: z
    .object({
      fullName: z.string().optional(),
      phone: z.string().optional(),
      dateOfBirth: z.string().optional(),
      preferredName: z.string().optional(),
      isDisabilityAffected: z.union([z.boolean(), booleanString]).optional(),
      isVeteran: z.union([z.boolean(), booleanString]).optional(),
      isPublicWorker: z.union([z.boolean(), booleanString]).optional()
    })
    .optional(),
  household: z
    .object({
      householdSize: z.number().int().min(1).optional(),
      members: z
        .array(
          z.object({
            fullName: z.string().optional(),
            relationship: z.string().optional(),
            dateOfBirth: z.string().optional(),
            isDependent: z.boolean().optional()
          })
        )
        .optional()
    })
    .optional(),
  income: z
    .union([
      z.object({
        monthlyIncome: z.number().nonnegative().optional(),
        employmentStatus: z.string().optional(),
        employer: z.string().optional(),
        workHours: z.number().nonnegative().optional(),
        sourceOfIncome: z.array(z.string()).optional(),
        incomeRange: z.string().optional()
      }),
      z.null()
    ])
    .optional(),
  education: z
    .object({
      highestEducationLevel: z.string().optional(),
      schoolName: z.string().optional(),
      graduationYear: z.number().int().optional()
    })
    .optional(),
  housing: z
    .object({
      currentHousingSituation: z.string().optional(),
      housingHistory: z
        .array(
          z.object({
            location: z.string().optional(),
            status: z.string().optional(),
            yearsAtAddress: z.number().nonnegative().optional()
          })
        )
        .optional()
    })
    .optional(),
  preferences: z
    .object({
      preferredLocations: z.array(z.string()).optional(),
      housingGoal: z.string().optional()
    })
    .optional(),
  documents: z
    .array(
      z.object({
        id: z.string().optional(),
        type: z.string().optional(),
        fileName: z.string().optional(),
        fileUrl: z.string().optional(),
        status: z.string().optional()
      })
    )
    .optional(),
  meta: z
    .object({
      completedSections: z.array(z.string()).optional(),
      lastUpdatedAt: z.string().optional(),
      version: z.number().int().optional(),
      answers: z.record(z.string(), z.unknown()).optional()
    })
    .optional()
});

export const applicantProfileSchema = z.preprocess((raw) => {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return mapFlatFormValues(raw as Record<string, unknown>);
  }
  return raw;
}, applicantProfileShape);

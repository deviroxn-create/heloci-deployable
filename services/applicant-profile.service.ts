import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@prisma/client";

export type ApplicantProfileSectionStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";

export type ApplicantProfile = {
  personal?: {
    fullName?: string;
    phone?: string;
    dateOfBirth?: string;
    preferredName?: string;
    isDisabilityAffected?: boolean;
    isVeteran?: boolean;
    isPublicWorker?: boolean;
  };
  household?: {
    householdSize?: number;
    members?: Array<{
      fullName?: string;
      relationship?: string;
      dateOfBirth?: string;
      isDependent?: boolean;
    }>;
  };
  income?: {
    monthlyIncome?: number;
    employmentStatus?: string;
    employer?: string;
    workHours?: number;
    sourceOfIncome?: string[];
  };
  employment?: {
    status?: string;
  };
  education?: {
    highestEducationLevel?: string;
    schoolName?: string;
    graduationYear?: number;
  };
  housing?: {
    currentHousingSituation?: string;
    housingHistory?: Array<{
      location?: string;
      status?: string;
      yearsAtAddress?: number;
    }>;
  };
  preferences?: {
    preferredLocations?: string[];
    housingGoal?: string;
  };
  documents?: Array<{
    id?: string;
    type?: string;
    fileName?: string;
    fileUrl?: string;
    status?: string;
  }>;
  meta?: {
    completedSections?: string[];
    lastUpdatedAt?: string;
    version?: number;
  };
};

export type ApplicantProfileCompleteness = {
  score: number;
  status: ApplicantProfileSectionStatus;
  completedSections: string[];
};

const SECTION_KEYS: Array<keyof ApplicantProfile> = ["personal", "household", "income", "education", "housing", "preferences"];

type LegacyProfilePayload = Record<string, unknown>;

function hasMeaningfulValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries.some(([, child]) => hasMeaningfulValue(child));
  }
  return false;
}

function coerceString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  return undefined;
}

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function coerceBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    if (lowered === "true") return true;
    if (lowered === "false") return false;
  }
  return undefined;
}

function coerceStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}

function isMissingRelationError(error: unknown): boolean {
  return error instanceof Error && /relation .* does not exist|relation .* does not exist|does not exist/i.test(error.message);
}

export function normalizeApplicantProfile(input: Partial<ApplicantProfile> = {}): ApplicantProfile {
  return {
    personal: input.personal ?? {},
    household: input.household ?? {},
    income: input.income ?? {},
    employment: input.employment ?? {},
    education: input.education ?? {},
    housing: input.housing ?? {},
    preferences: {
      preferredLocations: input.preferences?.preferredLocations ?? [],
      housingGoal: input.preferences?.housingGoal
    },
    documents: input.documents ?? [],
    meta: {
      completedSections: input.meta?.completedSections ?? [],
      lastUpdatedAt: input.meta?.lastUpdatedAt,
      version: input.meta?.version ?? 1
    }
  };
}

export function calculateProfileCompleteness(profile: ApplicantProfile): ApplicantProfileCompleteness {
  const normalized = normalizeApplicantProfile(profile);
  const completedSections = SECTION_KEYS.filter((section) => hasMeaningfulValue(normalized[section]));

  if (Array.isArray(normalized.documents) && normalized.documents.length > 0) {
    completedSections.push("documents");
  }

  const score = Math.round((completedSections.filter((section) => SECTION_KEYS.includes(section as keyof ApplicantProfile)).length / SECTION_KEYS.length) * 100);
  let status: ApplicantProfileSectionStatus = "NOT_STARTED";

  if (score >= 100) {
    status = "COMPLETE";
  } else if (score >= 50) {
    status = "IN_PROGRESS";
  }

  return {
    score,
    status,
    completedSections
  };
}

export function mapLegacyProfileData(input: LegacyProfilePayload = {}): ApplicantProfile {
  const getValue = (keys: string[]) => {
    for (const key of keys) {
      if (key in input) {
        return input[key];
      }
    }
    return undefined;
  };

  return normalizeApplicantProfile({
    personal: {
      fullName: coerceString(getValue(["full_name", "fullName", "name"])),
      phone: coerceString(getValue(["phone", "contact_phone"])),
      dateOfBirth: coerceString(getValue(["date_of_birth", "dateOfBirth"])),
      preferredName: coerceString(getValue(["preferred_name", "preferredName"])),
      isDisabilityAffected: coerceBoolean(getValue(["is_disability_affected", "isDisabilityAffected"])),
      isVeteran: coerceBoolean(getValue(["is_veteran", "isVeteran"])),
      isPublicWorker: coerceBoolean(getValue(["is_public_worker", "isPublicWorker"]))
    },
    household: {
      householdSize: coerceNumber(getValue(["household_size", "householdSize"])),
      members: Array.isArray(getValue(["household_members", "members"])) ? (getValue(["household_members", "members"]) as Array<Record<string, unknown>>) : undefined
    },
    income: {
      monthlyIncome: coerceNumber(getValue(["monthly_income", "monthlyIncome", "income"])),
      employmentStatus: coerceString(getValue(["employment_status", "employmentStatus"])),
      employer: coerceString(getValue(["employer"])),
      workHours: coerceNumber(getValue(["work_hours", "workHours"])),
      sourceOfIncome: coerceStringArray(getValue(["source_of_income", "sourceOfIncome"]))
    },
    education: {
      highestEducationLevel: coerceString(getValue(["highest_education_level", "highestEducationLevel"])),
      schoolName: coerceString(getValue(["school_name", "schoolName"])),
      graduationYear: coerceNumber(getValue(["graduation_year", "graduationYear"]))
    },
    housing: {
      currentHousingSituation: coerceString(getValue(["current_housing_situation", "currentHousingSituation"])),
      housingHistory: Array.isArray(getValue(["housing_history", "housingHistory"])) ? (getValue(["housing_history", "housingHistory"]) as Array<Record<string, unknown>>) : undefined
    },
    preferences: {
      preferredLocations: coerceStringArray(getValue(["preferred_locations", "preferredLocations"])) ?? [],
      housingGoal: coerceString(getValue(["housing_goal", "goal", "housingGoal"]))
    },
    documents: Array.isArray(getValue(["documents"])) ? (getValue(["documents"]) as Array<Record<string, unknown>>) : [],
    meta: {
      lastUpdatedAt: coerceString(getValue(["updated_at", "updatedAt"])),
      version: 1
    }
  });
}

export function toLegacyProfilePayload(profile: ApplicantProfile): LegacyProfilePayload {
  const payload: LegacyProfilePayload = {};
  if (profile.personal?.fullName) payload.full_name = profile.personal.fullName;
  if (profile.personal?.phone) payload.phone = profile.personal.phone;
  if (profile.personal?.dateOfBirth) payload.date_of_birth = profile.personal.dateOfBirth;
  if (profile.personal?.preferredName) payload.preferred_name = profile.personal.preferredName;
  if (profile.personal?.isDisabilityAffected !== undefined) payload.is_disability_affected = profile.personal.isDisabilityAffected;
  if (profile.personal?.isVeteran !== undefined) payload.is_veteran = profile.personal.isVeteran;
  if (profile.personal?.isPublicWorker !== undefined) payload.is_public_worker = profile.personal.isPublicWorker;
  if (profile.household?.householdSize !== undefined) payload.household_size = profile.household.householdSize;
  if (profile.income?.monthlyIncome !== undefined) payload.monthly_income = profile.income.monthlyIncome;
  if (profile.income?.employmentStatus) payload.employment_status = profile.income.employmentStatus;
  if (profile.income?.employer) payload.employer = profile.income.employer;
  if (profile.income?.workHours !== undefined) payload.work_hours = profile.income.workHours;
  if (profile.preferences?.housingGoal) payload.housing_goal = profile.preferences.housingGoal;
  if (profile.preferences?.preferredLocations?.length) payload.preferred_locations = profile.preferences.preferredLocations;
  if (profile.meta?.lastUpdatedAt) payload.updated_at = profile.meta.lastUpdatedAt;
  return payload;
}

async function readLegacyApplicantProfile(userId: string): Promise<LegacyProfilePayload | null> {
  try {
    const rows = await prisma.$queryRaw<Array<{ data: unknown }>>`
      SELECT data FROM user_profiles WHERE user_id = ${userId} LIMIT 1
    `;

    const raw = rows[0]?.data;
    if (!raw || typeof raw !== "object") {
      return null;
    }

    return raw as LegacyProfilePayload;
  } catch (error) {
    if (isMissingRelationError(error)) {
      return null;
    }
    throw error;
  }
}

async function writeLegacyApplicantProfile(userId: string, payload: LegacyProfilePayload) {
  try {
    await prisma.$executeRaw`
      INSERT INTO user_profiles (user_id, data, updated_at)
      VALUES (${userId}, ${JSON.stringify(payload)}, now())
      ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `;
  } catch (error) {
    if (isMissingRelationError(error)) {
      return;
    }
    throw error;
  }
}

async function persistApplicantProfile(userId: string, profile: ApplicantProfile, completeness: ApplicantProfileCompleteness) {
  try {
    await prisma.$executeRaw`
      INSERT INTO "ApplicantProfile" ("userId", "profileData", "completeness", "createdAt", "updatedAt")
      VALUES (${userId}, ${JSON.stringify(profile)}::jsonb, ${JSON.stringify(completeness)}::jsonb, now(), now())
      ON CONFLICT ("userId") DO UPDATE SET "profileData" = EXCLUDED."profileData", "completeness" = EXCLUDED."completeness", "updatedAt" = now()
    `;
  } catch (error) {
    if (error instanceof Error && /relation .*ApplicantProfile|does not exist/i.test(error.message)) {
      return;
    }
    throw error;
  }
}

export async function loadApplicantProfile(userId: string): Promise<ApplicantProfile> {
  try {
    const existingRows = await prisma.$queryRaw<Array<{ profileData: Prisma.JsonValue; completeness: Prisma.JsonValue }>>`
      SELECT "profileData", "completeness" FROM "ApplicantProfile" WHERE "userId" = ${userId} LIMIT 1
    `;
    const existing = existingRows[0];
    if (existing?.profileData) {
      return normalizeApplicantProfile(existing.profileData as Partial<ApplicantProfile>);
    }
  } catch (error) {
    if (error instanceof Error && /relation .*ApplicantProfile|does not exist/i.test(error.message)) {
      // Fall back to legacy storage until the Prisma table exists.
    } else {
      throw error;
    }
  }

  const legacy = await readLegacyApplicantProfile(userId);
  if (legacy) {
    const mapped = mapLegacyProfileData(legacy);
    const completeness = calculateProfileCompleteness(mapped);
    await persistApplicantProfile(userId, mapped, completeness);
    await writeLegacyApplicantProfile(userId, toLegacyProfilePayload(mapped));
    return mapped;
  }

  return normalizeApplicantProfile();
}

export async function getApplicantProfileData(userId: string): Promise<LegacyProfilePayload> {
  const profile = await loadApplicantProfile(userId);
  return toLegacyProfilePayload(profile);
}

export async function migrateLegacyApplicantProfile(userId: string) {
  const legacy = await readLegacyApplicantProfile(userId);
  if (!legacy) {
    return null;
  }

  const mapped = mapLegacyProfileData(legacy);
  const completeness = calculateProfileCompleteness(mapped);
  await persistApplicantProfile(userId, mapped, completeness);
  await writeLegacyApplicantProfile(userId, toLegacyProfilePayload(mapped));

  return {
    profile: mapped,
    completeness
  };
}

export async function saveApplicantProfile(input: Partial<ApplicantProfile> & { userId: string }, options?: { skipNotification?: boolean; skipLegacyWrite?: boolean }) {
  const normalized = normalizeApplicantProfile(input);
  const completeness = calculateProfileCompleteness(normalized);
  const profile = {
    ...normalized,
    meta: {
      ...normalized.meta,
      completedSections: completeness.completedSections,
      lastUpdatedAt: new Date().toISOString(),
      version: (normalized.meta?.version ?? 0) + 1
    }
  };

  await persistApplicantProfile(input.userId, profile, completeness);

  if (!options?.skipLegacyWrite) {
    await writeLegacyApplicantProfile(input.userId, toLegacyProfilePayload(profile));
  }

  if (!options?.skipNotification) {
    // Notification is handled by the server-side profile save route instead of client-facing service.
  }

  return {
    profile,
    completeness
  };
}

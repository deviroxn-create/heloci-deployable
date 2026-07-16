"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeApplicantProfile = normalizeApplicantProfile;
exports.calculateProfileCompleteness = calculateProfileCompleteness;
exports.mapLegacyProfileData = mapLegacyProfileData;
exports.toLegacyProfilePayload = toLegacyProfilePayload;
exports.loadApplicantProfile = loadApplicantProfile;
exports.getApplicantProfileData = getApplicantProfileData;
exports.migrateLegacyApplicantProfile = migrateLegacyApplicantProfile;
exports.saveApplicantProfile = saveApplicantProfile;
const client_1 = require("@/lib/prisma/client");
const SECTION_KEYS = ["personal", "household", "income", "education", "housing", "preferences"];
function hasMeaningfulValue(value) {
    if (value == null)
        return false;
    if (typeof value === "string")
        return value.trim().length > 0;
    if (typeof value === "number")
        return Number.isFinite(value);
    if (typeof value === "boolean")
        return true;
    if (Array.isArray(value))
        return value.length > 0;
    if (typeof value === "object") {
        const entries = Object.entries(value);
        return entries.some(([, child]) => hasMeaningfulValue(child));
    }
    return false;
}
function coerceString(value) {
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed ? trimmed : undefined;
    }
    return undefined;
}
function coerceNumber(value) {
    if (typeof value === "number" && Number.isFinite(value))
        return value;
    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}
function coerceBoolean(value) {
    if (typeof value === "boolean")
        return value;
    if (typeof value === "string") {
        const lowered = value.toLowerCase();
        if (lowered === "true")
            return true;
        if (lowered === "false")
            return false;
    }
    return undefined;
}
function coerceStringArray(value) {
    if (Array.isArray(value)) {
        return value.map((item) => String(item)).filter(Boolean);
    }
    if (typeof value === "string") {
        return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
    return undefined;
}
function isMissingRelationError(error) {
    return error instanceof Error && /relation .* does not exist|relation .* does not exist|does not exist/i.test(error.message);
}
function normalizeApplicantProfile(input = {}) {
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
function calculateProfileCompleteness(profile) {
    const normalized = normalizeApplicantProfile(profile);
    const completedSections = SECTION_KEYS.filter((section) => hasMeaningfulValue(normalized[section]));
    if (Array.isArray(normalized.documents) && normalized.documents.length > 0) {
        completedSections.push("documents");
    }
    const score = Math.round((completedSections.filter((section) => SECTION_KEYS.includes(section)).length / SECTION_KEYS.length) * 100);
    let status = "NOT_STARTED";
    if (score >= 100) {
        status = "COMPLETE";
    }
    else if (score >= 50) {
        status = "IN_PROGRESS";
    }
    return {
        score,
        status,
        completedSections
    };
}
function mapLegacyProfileData(input = {}) {
    const getValue = (keys) => {
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
            members: Array.isArray(getValue(["household_members", "members"])) ? getValue(["household_members", "members"]) : undefined
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
            housingHistory: Array.isArray(getValue(["housing_history", "housingHistory"])) ? getValue(["housing_history", "housingHistory"]) : undefined
        },
        preferences: {
            preferredLocations: coerceStringArray(getValue(["preferred_locations", "preferredLocations"])) ?? [],
            housingGoal: coerceString(getValue(["housing_goal", "goal", "housingGoal"]))
        },
        documents: Array.isArray(getValue(["documents"])) ? getValue(["documents"]) : [],
        meta: {
            lastUpdatedAt: coerceString(getValue(["updated_at", "updatedAt"])),
            version: 1
        }
    });
}
function toLegacyProfilePayload(profile) {
    const payload = {};
    if (profile.personal?.fullName)
        payload.full_name = profile.personal.fullName;
    if (profile.personal?.phone)
        payload.phone = profile.personal.phone;
    if (profile.personal?.dateOfBirth)
        payload.date_of_birth = profile.personal.dateOfBirth;
    if (profile.personal?.preferredName)
        payload.preferred_name = profile.personal.preferredName;
    if (profile.personal?.isDisabilityAffected !== undefined)
        payload.is_disability_affected = profile.personal.isDisabilityAffected;
    if (profile.personal?.isVeteran !== undefined)
        payload.is_veteran = profile.personal.isVeteran;
    if (profile.personal?.isPublicWorker !== undefined)
        payload.is_public_worker = profile.personal.isPublicWorker;
    if (profile.household?.householdSize !== undefined)
        payload.household_size = profile.household.householdSize;
    if (profile.income?.monthlyIncome !== undefined)
        payload.monthly_income = profile.income.monthlyIncome;
    if (profile.income?.employmentStatus)
        payload.employment_status = profile.income.employmentStatus;
    if (profile.income?.employer)
        payload.employer = profile.income.employer;
    if (profile.income?.workHours !== undefined)
        payload.work_hours = profile.income.workHours;
    if (profile.preferences?.housingGoal)
        payload.housing_goal = profile.preferences.housingGoal;
    if (profile.preferences?.preferredLocations?.length)
        payload.preferred_locations = profile.preferences.preferredLocations;
    if (profile.meta?.lastUpdatedAt)
        payload.updated_at = profile.meta.lastUpdatedAt;
    return payload;
}
async function readLegacyApplicantProfile(userId) {
    try {
        const rows = await client_1.prisma.$queryRaw `
      SELECT data FROM user_profiles WHERE user_id = ${userId} LIMIT 1
    `;
        const raw = rows[0]?.data;
        if (!raw || typeof raw !== "object") {
            return null;
        }
        return raw;
    }
    catch (error) {
        if (isMissingRelationError(error)) {
            return null;
        }
        throw error;
    }
}
async function writeLegacyApplicantProfile(userId, payload) {
    try {
        await client_1.prisma.$executeRaw `
      INSERT INTO user_profiles (user_id, data, updated_at)
      VALUES (${userId}, ${JSON.stringify(payload)}, now())
      ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `;
    }
    catch (error) {
        if (isMissingRelationError(error)) {
            return;
        }
        throw error;
    }
}
async function persistApplicantProfile(userId, profile, completeness) {
    try {
        await client_1.prisma.$executeRaw `
      INSERT INTO "ApplicantProfile" ("userId", "profileData", "completeness", "createdAt", "updatedAt")
      VALUES (${userId}, ${JSON.stringify(profile)}::jsonb, ${JSON.stringify(completeness)}::jsonb, now(), now())
      ON CONFLICT ("userId") DO UPDATE SET "profileData" = EXCLUDED."profileData", "completeness" = EXCLUDED."completeness", "updatedAt" = now()
    `;
    }
    catch (error) {
        if (error instanceof Error && /relation .*ApplicantProfile|does not exist/i.test(error.message)) {
            return;
        }
        throw error;
    }
}
async function loadApplicantProfile(userId) {
    try {
        const existingRows = await client_1.prisma.$queryRaw `
      SELECT "profileData", "completeness" FROM "ApplicantProfile" WHERE "userId" = ${userId} LIMIT 1
    `;
        const existing = existingRows[0];
        if (existing?.profileData) {
            return normalizeApplicantProfile(existing.profileData);
        }
    }
    catch (error) {
        if (error instanceof Error && /relation .*ApplicantProfile|does not exist/i.test(error.message)) {
            // Fall back to legacy storage until the Prisma table exists.
        }
        else {
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
async function getApplicantProfileData(userId) {
    const profile = await loadApplicantProfile(userId);
    return toLegacyProfilePayload(profile);
}
async function migrateLegacyApplicantProfile(userId) {
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
async function saveApplicantProfile(input, options) {
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

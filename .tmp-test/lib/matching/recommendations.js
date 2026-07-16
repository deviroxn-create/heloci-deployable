"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRecommendations = generateRecommendations;
const notification_service_1 = require("@/lib/notifications/notification.service");
const client_1 = require("@/lib/prisma/client");
const applicant_profile_service_1 = require("@/services/applicant-profile.service");
function asStringArray(value) {
    if (Array.isArray(value)) {
        return value.filter((entry) => typeof entry === "string");
    }
    return [];
}
function getNestedValue(source, path) {
    return path.split(".").reduce((current, segment) => {
        if (current && typeof current === "object" && segment in current) {
            return current[segment];
        }
        return undefined;
    }, source);
}
async function generateRecommendations(userId) {
    const results = await client_1.prisma.eligibilityResult.findMany({
        where: { userId, isEligible: false },
        include: { program: true }
    });
    const profile = await (0, applicant_profile_service_1.loadApplicantProfile)(userId);
    const profileData = profile;
    const created = [];
    for (const result of results) {
        const failed = asStringArray(result.reason?.failed);
        if (failed.length > 2)
            continue;
        const missingFields = [];
        if (failed.some((entry) => /income/i.test(entry)) && !getNestedValue(profileData, "income.monthlyIncome") && !getNestedValue(profileData, "income.monthly")) {
            missingFields.push("income.monthlyIncome");
        }
        if (failed.some((entry) => /employment|teacher|work/i.test(entry)) && !getNestedValue(profileData, "employment.status")) {
            missingFields.push("employment.status");
        }
        if (missingFields.length > 0) {
            created.push({ programId: result.programId, reason: `Complete ${missingFields.join(", ")}`, missingFields });
        }
    }
    await client_1.prisma.programRecommendation.deleteMany({ where: { userId } });
    await Promise.all(created.map((item) => client_1.prisma.programRecommendation.create({
        data: {
            userId,
            programId: item.programId,
            type: "recommended_action",
            reason: item.reason,
            missingFields: item.missingFields
        }
    })));
    if (created.length > 0) {
        await notification_service_1.notificationService.notify("new_recommendation_available", {
            userId,
            programCount: created.length,
            missingFields: created.flatMap((item) => item.missingFields).join(", "),
            locale: "en"
        });
    }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProgramMatches = getProgramMatches;
exports.generateRecommendations = generateRecommendations;
const client_1 = require("@/lib/prisma/client");
const notification_service_1 = require("@/lib/notifications/notification.service");
const applicant_profile_service_1 = require("@/services/applicant-profile.service");
function toScore(value, isEligible) {
    return value ?? (isEligible ? 100 : 0);
}
function asStringArray(value) {
    if (Array.isArray(value)) {
        return value.filter((entry) => typeof entry === "string");
    }
    return [];
}
function getReasonData(reason) {
    const payload = reason ?? {};
    return {
        matched: asStringArray(payload.matched),
        failed: asStringArray(payload.failed),
        scoreBreakdown: Array.isArray(payload.score_breakdown)
            ? payload.score_breakdown.filter((entry) => typeof entry === "object" && entry !== null).map((entry) => ({
                rule: String(entry.rule ?? "Rule"),
                points: typeof entry.points === "number" ? entry.points : 0
            }))
            : []
    };
}
function getApplicationStatus(programId, applications) {
    const match = applications.find((application) => application.programId === programId);
    if (!match)
        return "not_started";
    if (match.status === "draft")
        return "draft";
    if (match.status === "submitted")
        return "submitted";
    return "not_started";
}
async function getEligiblePrograms(userId) {
    const profile = await (0, applicant_profile_service_1.loadApplicantProfile)(userId);
    const profileData = profile;
    const user = await client_1.prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true }
    });
    const whereClause = {
        userId,
        program: {
            status: "active",
            OR: [
                { isPublic: true },
                ...(user?.organizationId ? [{ organizationId: user.organizationId }] : [])
            ]
        }
    };
    const results = await client_1.prisma.eligibilityResult.findMany({
        where: whereClause,
        include: {
            program: true
        },
        orderBy: [
            { isEligible: "desc" },
            { score: "desc" },
            { program: { priority: "desc" } }
        ]
    });
    const applications = await client_1.prisma.programApplication.findMany({
        where: { userId },
        select: { programId: true, status: true }
    });
    return { profileData, results, applications };
}
async function getProgramMatches(userId) {
    const { results, applications } = await getEligiblePrograms(userId);
    const matches = results
        .filter((result) => {
        const deadline = result.program.deadline;
        if (!deadline)
            return true;
        return deadline >= new Date() || applications.some((application) => application.programId === result.programId);
    })
        .map((result) => {
        const reason = getReasonData(result.reason);
        const score = toScore(result.score, result.isEligible);
        return {
            programId: result.programId,
            programName: result.program.name,
            programSlug: result.program.slug,
            programCategory: result.program.category ?? "rental",
            isEligible: result.isEligible,
            score,
            priority: result.program.priority ?? 0,
            deadline: result.program.deadline ?? undefined,
            matched: reason.matched,
            failed: reason.failed,
            scoreBreakdown: reason.scoreBreakdown,
            needsReview: result.needsReview,
            matchDescription: result.program.matchDescription ?? undefined,
            applicationStatus: getApplicationStatus(result.programId, applications)
        };
    })
        .sort((left, right) => Number(right.isEligible) - Number(left.isEligible) || right.score - left.score || right.priority - left.priority);
    const eligible = matches.filter((item) => item.isEligible);
    const nearlyEligible = matches.filter((item) => !item.isEligible && item.score >= 70);
    const recommendedActions = await buildRecommendedActions(userId, matches, results);
    await notifyNewMatches(userId, eligible);
    return {
        eligible,
        nearlyEligible,
        recommendedActions
    };
}
async function buildRecommendedActions(userId, matches, results) {
    const profile = await (0, applicant_profile_service_1.loadApplicantProfile)(userId);
    const profileData = profile;
    const missingFields = new Set();
    const actionable = matches.filter((match) => !match.isEligible && match.failed.length <= 2);
    for (const match of actionable) {
        for (const failure of match.failed) {
            if (/income/i.test(failure) && !getNestedValue(profileData, "income.monthlyIncome") && !getNestedValue(profileData, "income.monthly")) {
                missingFields.add("income.monthlyIncome");
            }
            if (/employment|teacher|work/i.test(failure) && !getNestedValue(profileData, "employment.status")) {
                missingFields.add("employment.status");
            }
        }
    }
    const recommendations = Array.from(missingFields).map((field) => ({
        action: field === "income.monthlyIncome" ? "Add income details to unlock more matches" : "Add employment details to unlock more matches",
        programs: actionable.map((item) => item.programName).slice(0, 3),
        missingFields: [field]
    }));
    await client_1.prisma.programRecommendation.deleteMany({ where: { userId } });
    await Promise.all(recommendations.map((recommendation) => client_1.prisma.programRecommendation.create({
        data: {
            userId,
            programId: results.find((result) => result.program.name === recommendation.programs[0])?.programId ?? results[0]?.programId ?? "",
            type: "recommended_action",
            reason: recommendation.action,
            missingFields: recommendation.missingFields
        }
    })));
    return recommendations;
}
async function notifyNewMatches(userId, matches) {
    for (const match of matches) {
        const latest = await client_1.prisma.eligibilityResult.findFirst({
            where: { userId, programId: match.programId },
            select: { notifiedAt: true }
        });
        if (latest?.notifiedAt)
            continue;
        await notification_service_1.notificationService.notify("program_matched", {
            userId,
            programId: match.programId,
            programName: match.programName,
            score: match.score,
            matchDescription: match.matchDescription,
            deadline: match.deadline ? match.deadline.toISOString() : undefined,
            locale: "en"
        });
        await client_1.prisma.eligibilityResult.updateMany({
            where: { userId, programId: match.programId },
            data: { notifiedAt: new Date() }
        });
    }
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
}

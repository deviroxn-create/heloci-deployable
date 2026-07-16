"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const client_1 = require("@/lib/prisma/client");
const engine_1 = require("./engine");
const recommendations_1 = require("./recommendations");
const notification_service_1 = require("@/lib/notifications/notification.service");
function makeTestId(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}
async function createUserWithProfile(overrides = {}) {
    const user = await client_1.prisma.user.create({
        data: {
            email: `${makeTestId("user")}@example.com`,
            name: "Test User",
            organizationId: "org-1",
            ...overrides
        }
    });
    await client_1.prisma.applicantProfile.create({
        data: {
            userId: user.id,
            profileData: {
                personal: { fullName: "Test User" },
                income: { monthlyIncome: 3000 },
                employment: { status: "teacher" },
                household: { householdSize: 2 }
            },
            completeness: {
                score: 50,
                status: "IN_PROGRESS",
                completedSections: []
            }
        }
    });
    return user;
}
async function createProgram(input) {
    const { slug, name, housingGoal, organizationId, priority, category, deadline, matchDescription, isPublic, ...rest } = input;
    return client_1.prisma.program.create({
        data: {
            organizationId: organizationId ?? "org-1",
            name: name,
            slug: makeTestId(String(slug ?? "program")),
            housingGoal: housingGoal ?? "Support housing",
            createdBy: rest.createdBy ?? "test-user",
            status: "active",
            isPublic: isPublic ?? true,
            priority: priority ?? 0,
            category: category ?? "rental",
            deadline: deadline,
            matchDescription: matchDescription,
            ...rest
        }
    });
}
(0, node_test_1.default)("returns eligible programs sorted by score desc", async () => {
    const user = await createUserWithProfile();
    const first = await createProgram({ name: "Alpha", slug: "alpha", housingGoal: "Support", organizationId: "org-1", priority: 5, createdBy: user.id });
    const second = await createProgram({ name: "Beta", slug: "beta", housingGoal: "Support", organizationId: "org-1", priority: 1, createdBy: user.id });
    await client_1.prisma.eligibilityResult.createMany({
        data: [
            { userId: user.id, programId: first.id, isEligible: true, score: 91, reason: { matched: ["Employment"], failed: [] }, ruleVersion: 1, needsReview: false },
            { userId: user.id, programId: second.id, isEligible: true, score: 88, reason: { matched: ["Income"], failed: [] }, ruleVersion: 1, needsReview: false }
        ]
    });
    const matches = await (0, engine_1.getProgramMatches)(user.id);
    strict_1.default.equal(matches.eligible.length, 2);
    strict_1.default.equal(matches.eligible[0].programName, "Alpha");
    strict_1.default.equal(matches.eligible[1].programName, "Beta");
});
(0, node_test_1.default)("places high-scoring near misses into nearly eligible", async () => {
    const user = await createUserWithProfile();
    const program = await createProgram({ name: "Near Miss", slug: "near-miss", housingGoal: "Support", organizationId: "org-1" });
    await client_1.prisma.eligibilityResult.create({
        data: {
            userId: user.id,
            programId: program.id,
            isEligible: false,
            score: 75,
            reason: { matched: ["Employment"], failed: ["Income below threshold"] },
            ruleVersion: 1,
            needsReview: false
        }
    });
    const matches = await (0, engine_1.getProgramMatches)(user.id);
    strict_1.default.equal(matches.nearlyEligible.length, 1);
    strict_1.default.equal(matches.nearlyEligible[0].programName, "Near Miss");
});
(0, node_test_1.default)("generates recommendations when profile fields are missing", async () => {
    const user = await createUserWithProfile({ organizationId: "org-1" });
    const program = await createProgram({ name: "Needs Income", slug: "needs-income", housingGoal: "Support", organizationId: "org-1" });
    await client_1.prisma.eligibilityResult.create({
        data: {
            userId: user.id,
            programId: program.id,
            isEligible: false,
            score: 65,
            reason: { matched: [], failed: ["Income below threshold"] },
            ruleVersion: 1,
            needsReview: false
        }
    });
    await client_1.prisma.applicantProfile.update({
        where: { userId: user.id },
        data: { profileData: { personal: { fullName: "Test User" }, employment: { status: "teacher" } } }
    });
    await (0, recommendations_1.generateRecommendations)(user.id);
    const recommendation = await client_1.prisma.programRecommendation.findFirst({
        where: { userId: user.id, programId: program.id, type: "recommended_action" }
    });
    strict_1.default.ok(recommendation);
    strict_1.default.ok(recommendation?.missingFields && Array.isArray(recommendation.missingFields));
});
(0, node_test_1.default)("surfaces manual review flags", async () => {
    const user = await createUserWithProfile();
    const program = await createProgram({ name: "Manual Review", slug: "manual-review", housingGoal: "Support", organizationId: "org-1" });
    await client_1.prisma.eligibilityResult.create({
        data: {
            userId: user.id,
            programId: program.id,
            isEligible: true,
            score: 82,
            reason: { matched: ["Employment"], failed: [] },
            ruleVersion: 1,
            needsReview: true
        }
    });
    const matches = await (0, engine_1.getProgramMatches)(user.id);
    strict_1.default.equal(matches.eligible[0].needsReview, true);
});
(0, node_test_1.default)("notifies only once for eligible matches", async () => {
    const user = await createUserWithProfile();
    const program = await createProgram({ name: "Eligible", slug: "eligible", housingGoal: "Support", organizationId: "org-1" });
    const calls = [];
    const originalNotify = notification_service_1.notificationService.notify;
    notification_service_1.notificationService.notify = async (eventName, payload) => {
        calls.push({ eventName: eventName, programName: payload?.programName });
        return { delivered: true, reason: "mock", error: "" };
    };
    await client_1.prisma.eligibilityResult.create({
        data: {
            userId: user.id,
            programId: program.id,
            isEligible: true,
            score: 92,
            reason: { matched: ["Employment"], failed: [] },
            ruleVersion: 1,
            needsReview: false
        }
    });
    await (0, engine_1.getProgramMatches)(user.id);
    await (0, engine_1.getProgramMatches)(user.id);
    strict_1.default.equal(calls.filter((call) => call.eventName === "program_matched").length, 1);
    notification_service_1.notificationService.notify = originalNotify;
});
(0, node_test_1.default)("includes public and org-specific programs for matching users", async () => {
    const user = await createUserWithProfile({ organizationId: "org-2" });
    const publicProgram = await createProgram({ name: "Public Program", slug: "public", housingGoal: "Support", organizationId: "org-1", isPublic: true });
    const orgProgram = await createProgram({ name: "Org Program", slug: "org", housingGoal: "Support", organizationId: "org-2", isPublic: false });
    await client_1.prisma.eligibilityResult.createMany({
        data: [
            { userId: user.id, programId: publicProgram.id, isEligible: true, score: 86, reason: { matched: ["Employment"], failed: [] }, ruleVersion: 1, needsReview: false },
            { userId: user.id, programId: orgProgram.id, isEligible: true, score: 84, reason: { matched: ["Employment"], failed: [] }, ruleVersion: 1, needsReview: false }
        ]
    });
    const matches = await (0, engine_1.getProgramMatches)(user.id);
    strict_1.default.equal(matches.eligible.some((item) => item.programName === "Public Program"), true);
    strict_1.default.equal(matches.eligible.some((item) => item.programName === "Org Program"), true);
});
(0, node_test_1.default)("excludes expired programs unless the user already applied", async () => {
    const user = await createUserWithProfile();
    const expired = await createProgram({ name: "Expired", slug: "expired", housingGoal: "Support", organizationId: "org-1", deadline: new Date(Date.now() - 1000) });
    await client_1.prisma.eligibilityResult.create({
        data: {
            userId: user.id,
            programId: expired.id,
            isEligible: true,
            score: 80,
            reason: { matched: ["Employment"], failed: [] },
            ruleVersion: 1,
            needsReview: false
        }
    });
    const matches = await (0, engine_1.getProgramMatches)(user.id);
    strict_1.default.equal(matches.eligible.some((item) => item.programName === "Expired"), false);
});
(0, node_test_1.default)("maps draft applications to continue application action", async () => {
    const user = await createUserWithProfile();
    const program = await createProgram({ name: "Draft App", slug: "draft-app", housingGoal: "Support", organizationId: "org-1" });
    await client_1.prisma.programApplication.create({
        data: {
            userId: user.id,
            programId: program.id,
            status: "draft",
            data: {},
            currentPage: 0
        }
    });
    await client_1.prisma.eligibilityResult.create({
        data: {
            userId: user.id,
            programId: program.id,
            isEligible: true,
            score: 90,
            reason: { matched: ["Employment"], failed: [] },
            ruleVersion: 1,
            needsReview: false
        }
    });
    const matches = await (0, engine_1.getProgramMatches)(user.id);
    strict_1.default.equal(matches.eligible[0].applicationStatus, "draft");
});

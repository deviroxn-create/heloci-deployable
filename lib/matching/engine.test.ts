import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma/client";
import { getProgramMatches } from "./engine";
import { generateRecommendations } from "./recommendations";
import { notificationService } from "@/lib/notifications/notification.service";

function makeTestId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

async function createUserWithProfile(overrides: Record<string, unknown> = {}) {
  const user = await prisma.user.create({
    data: {
      email: `${makeTestId("user")}@example.com`,
      name: "Test User",
      organizationId: "org-1",
      ...overrides
    }
  });

  await prisma.applicantProfile.create({
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

async function createProgram(input: Record<string, unknown>) {
  const {
    slug,
    name,
    housingGoal,
    organizationId,
    priority,
    category,
    deadline,
    matchDescription,
    isPublic,
    ...rest
  } = input;

  return prisma.program.create({
    data: {
      organizationId: (organizationId as string) ?? "org-1",
      name: name as string,
      slug: makeTestId(String(slug ?? "program")),
      housingGoal: (housingGoal as string) ?? "Support housing",
      createdBy: (rest.createdBy as string) ?? "test-user",
      status: "active",
      isPublic: (isPublic as boolean) ?? true,
      priority: (priority as number) ?? 0,
      category: (category as string) ?? "rental",
      deadline: deadline as Date | undefined,
      matchDescription: matchDescription as string | undefined,
      ...rest
    }
  });
}

test("returns eligible programs sorted by score desc", async () => {
  const user = await createUserWithProfile();
  const first = await createProgram({ name: "Alpha", slug: "alpha", housingGoal: "Support", organizationId: "org-1", priority: 5, createdBy: user.id });
  const second = await createProgram({ name: "Beta", slug: "beta", housingGoal: "Support", organizationId: "org-1", priority: 1, createdBy: user.id });

  await prisma.eligibilityResult.createMany({
    data: [
      { userId: user.id, programId: first.id, isEligible: true, score: 91, reason: { matched: ["Employment"], failed: [] }, ruleVersion: 1, needsReview: false },
      { userId: user.id, programId: second.id, isEligible: true, score: 88, reason: { matched: ["Income"], failed: [] }, ruleVersion: 1, needsReview: false }
    ]
  });

  const matches = await getProgramMatches(user.id);

  assert.equal(matches.eligible.length, 2);
  assert.equal(matches.eligible[0].programName, "Alpha");
  assert.equal(matches.eligible[1].programName, "Beta");
});

test("places high-scoring near misses into nearly eligible", async () => {
  const user = await createUserWithProfile();
  const program = await createProgram({ name: "Near Miss", slug: "near-miss", housingGoal: "Support", organizationId: "org-1" });

  await prisma.eligibilityResult.create({
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

  const matches = await getProgramMatches(user.id);

  assert.equal(matches.nearlyEligible.length, 1);
  assert.equal(matches.nearlyEligible[0].programName, "Near Miss");
});

test("generates recommendations when profile fields are missing", async () => {
  const user = await createUserWithProfile({ organizationId: "org-1" });
  const program = await createProgram({ name: "Needs Income", slug: "needs-income", housingGoal: "Support", organizationId: "org-1" });

  await prisma.eligibilityResult.create({
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

  await prisma.applicantProfile.update({
    where: { userId: user.id },
    data: { profileData: { personal: { fullName: "Test User" }, employment: { status: "teacher" } } }
  });

  await generateRecommendations(user.id);

  const recommendation = await prisma.programRecommendation.findFirst({
    where: { userId: user.id, programId: program.id, type: "recommended_action" }
  });

  assert.ok(recommendation);
  assert.ok(recommendation?.missingFields && Array.isArray(recommendation.missingFields));
});

test("surfaces manual review flags", async () => {
  const user = await createUserWithProfile();
  const program = await createProgram({ name: "Manual Review", slug: "manual-review", housingGoal: "Support", organizationId: "org-1" });

  await prisma.eligibilityResult.create({
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

  const matches = await getProgramMatches(user.id);

  assert.equal(matches.eligible[0].needsReview, true);
});

test("notifies only once for eligible matches", async () => {
  const user = await createUserWithProfile();
  const program = await createProgram({ name: "Eligible", slug: "eligible", housingGoal: "Support", organizationId: "org-1" });
  const calls: Array<{ eventName: string; programName?: string }> = [];

  const originalNotify = notificationService.notify;
  (notificationService as typeof notificationService & { notify: typeof notificationService.notify }).notify = async (eventName, payload) => {
    calls.push({ eventName: eventName as string, programName: payload?.programName as string | undefined });
    return { delivered: true, reason: "mock", error: "" };
  };

  await prisma.eligibilityResult.create({
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

  await getProgramMatches(user.id);
  await getProgramMatches(user.id);

  assert.equal(calls.filter((call) => call.eventName === "program_matched").length, 1);
  (notificationService as typeof notificationService & { notify: typeof notificationService.notify }).notify = originalNotify;
});

test("includes public and org-specific programs for matching users", async () => {
  const user = await createUserWithProfile({ organizationId: "org-2" });
  const publicProgram = await createProgram({ name: "Public Program", slug: "public", housingGoal: "Support", organizationId: "org-1", isPublic: true });
  const orgProgram = await createProgram({ name: "Org Program", slug: "org", housingGoal: "Support", organizationId: "org-2", isPublic: false });

  await prisma.eligibilityResult.createMany({
    data: [
      { userId: user.id, programId: publicProgram.id, isEligible: true, score: 86, reason: { matched: ["Employment"], failed: [] }, ruleVersion: 1, needsReview: false },
      { userId: user.id, programId: orgProgram.id, isEligible: true, score: 84, reason: { matched: ["Employment"], failed: [] }, ruleVersion: 1, needsReview: false }
    ]
  });

  const matches = await getProgramMatches(user.id);

  assert.equal(matches.eligible.some((item) => item.programName === "Public Program"), true);
  assert.equal(matches.eligible.some((item) => item.programName === "Org Program"), true);
});

test("excludes expired programs unless the user already applied", async () => {
  const user = await createUserWithProfile();
  const expired = await createProgram({ name: "Expired", slug: "expired", housingGoal: "Support", organizationId: "org-1", deadline: new Date(Date.now() - 1000) });

  await prisma.eligibilityResult.create({
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

  const matches = await getProgramMatches(user.id);

  assert.equal(matches.eligible.some((item) => item.programName === "Expired"), false);
});

test("maps draft applications to continue application action", async () => {
  const user = await createUserWithProfile();
  const program = await createProgram({ name: "Draft App", slug: "draft-app", housingGoal: "Support", organizationId: "org-1" });
  await prisma.programApplication.create({
    data: {
      userId: user.id,
      programId: program.id,
      status: "draft",
      data: {},
      currentPage: 0
    }
  });
  await prisma.eligibilityResult.create({
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

  const matches = await getProgramMatches(user.id);

  assert.equal(matches.eligible[0].applicationStatus, "draft");
});

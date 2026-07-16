import { prisma } from "@/lib/prisma/client";
import { notificationService } from "@/lib/notifications/notification.service";
import { loadApplicantProfile } from "@/services/applicant-profile.service";
import type { Prisma } from "@prisma/client";

export interface ProgramMatch {
  programId: string;
  programName: string;
  programSlug: string;
  programCategory: string;
  isEligible: boolean;
  score: number;
  priority: number;
  deadline?: Date;
  matched: string[];
  failed: string[];
  scoreBreakdown: Array<{ rule: string; points: number }>;
  needsReview: boolean;
  matchDescription?: string;
  applicationStatus?: "not_started" | "draft" | "submitted";
}

export interface MatchResult {
  eligible: ProgramMatch[];
  nearlyEligible: ProgramMatch[];
  recommendedActions: Array<{
    action: string;
    programs: string[];
    missingFields: string[];
  }>;
}

type EligibilityResultWithProgram = Prisma.EligibilityResultGetPayload<{
  include: { program: true };
}>;

function toScore(value: number | null | undefined, isEligible: boolean) {
  return value ?? (isEligible ? 100 : 0);
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  return [];
}

function getReasonData(reason: unknown) {
  const payload = (reason as Record<string, unknown> | null) ?? {};
  return {
    matched: asStringArray(payload.matched),
    failed: asStringArray(payload.failed),
    scoreBreakdown: Array.isArray(payload.score_breakdown)
      ? payload.score_breakdown.filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null).map((entry) => ({
          rule: String(entry.rule ?? "Rule"),
          points: typeof entry.points === "number" ? entry.points : 0
        }))
      : []
  };
}

function getApplicationStatus(programId: string, applications: Array<{ programId: string; status: string }>) {
  const match = applications.find((application) => application.programId === programId);
  if (!match) return "not_started";
  if (match.status === "draft") return "draft";
  if (match.status === "submitted") return "submitted";
  return "not_started";
}

async function getEligiblePrograms(userId: string) {
  const profile = await loadApplicantProfile(userId);
  const profileData = profile as Record<string, unknown>;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true }
  });

  const whereClause: Prisma.EligibilityResultWhereInput = {
    userId,
    program: {
      status: "active",
      OR: [
        { isPublic: true },
        ...(user?.organizationId ? [{ organizationId: user.organizationId }] : [])
      ]
    }
  };

  const results = await prisma.eligibilityResult.findMany({
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

  const applications = await prisma.programApplication.findMany({
    where: { userId },
    select: { programId: true, status: true }
  });

  return { profileData, results, applications };
}

export async function getProgramMatches(userId: string): Promise<MatchResult> {
  const { results, applications } = await getEligiblePrograms(userId);

  const matches = (results as EligibilityResultWithProgram[])
    .filter((result) => {
      const deadline = result.program.deadline;
      if (!deadline) return true;
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
      } satisfies ProgramMatch;
    })
    .sort((left, right) => Number(right.isEligible) - Number(left.isEligible) || right.score - left.score || right.priority - left.priority);

  const eligible = matches.filter((item) => item.isEligible);
  const nearlyEligible = matches.filter((item) => !item.isEligible && item.score >= 70);

  const recommendedActions = await buildRecommendedActions(userId, matches, results as EligibilityResultWithProgram[]);

  await notifyNewMatches(userId, eligible);

  return {
    eligible,
    nearlyEligible,
    recommendedActions
  };
}

async function buildRecommendedActions(userId: string, matches: ProgramMatch[], results: EligibilityResultWithProgram[]) {
  const profile = await loadApplicantProfile(userId);
  const profileData = profile as Record<string, unknown>;
  const missingFields = new Set<string>();

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

  await prisma.programRecommendation.deleteMany({ where: { userId } });
  await Promise.all(recommendations.map((recommendation) => prisma.programRecommendation.create({
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

async function notifyNewMatches(userId: string, matches: ProgramMatch[]) {
  for (const match of matches) {
    const latest = await prisma.eligibilityResult.findFirst({
      where: { userId, programId: match.programId },
      select: { notifiedAt: true }
    });
    if (latest?.notifiedAt) continue;

    await notificationService.notify("program_matched", {
      userId,
      programId: match.programId,
      programName: match.programName,
      score: match.score,
      matchDescription: match.matchDescription,
      deadline: match.deadline ? match.deadline.toISOString() : undefined,
      locale: "en"
    });

    await prisma.eligibilityResult.updateMany({
      where: { userId, programId: match.programId },
      data: { notifiedAt: new Date() }
    });
  }
}

function getNestedValue(source: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}

export async function generateRecommendations(userId: string): Promise<void> {
  const results = await prisma.eligibilityResult.findMany({
    where: { userId, isEligible: false },
    include: { program: true }
  });

  const profile = await loadApplicantProfile(userId);
  const profileData = profile as Record<string, unknown>;

  const created: Array<{ programId: string; reason: string; missingFields: string[] }> = [];
  for (const result of results) {
    const failed = asStringArray((result.reason as Record<string, unknown> | undefined)?.failed);
    if (failed.length > 2) continue;

    const missingFields = [] as string[];
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

  await prisma.programRecommendation.deleteMany({ where: { userId } });
  await Promise.all(created.map((item) => prisma.programRecommendation.create({
    data: {
      userId,
      programId: item.programId,
      type: "recommended_action",
      reason: item.reason,
      missingFields: item.missingFields
    }
  })));
}

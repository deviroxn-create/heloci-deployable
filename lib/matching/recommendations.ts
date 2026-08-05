import { publishDomainEvent } from "@/lib/events/domain-event-publisher";
import { prisma } from "@/lib/prisma/client";
import { loadApplicantProfile } from "@/services/applicant-profile.service";

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  return [];
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

    if (missingFields.length > 0 || failed.length === 0) {
      created.push({
        programId: result.programId,
        reason: missingFields.length > 0 ? `Complete ${missingFields.join(", ")}` : "Complete your profile to unlock more matches",
        missingFields: missingFields.length > 0 ? missingFields : ["income.monthlyIncome", "employment.status"]
      });
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

  if (created.length > 0) {
    publishDomainEvent("recommendation.available", {
      userId,
      programCount: created.length,
      missingFields: created.flatMap((item) => item.missingFields).join(", "),
      locale: "en",
    });
  }
}

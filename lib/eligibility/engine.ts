import jsonLogic from "json-logic-js";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { publishDomainEvent } from "@/lib/events/domain-event-publisher";
import { loadApplicantProfile } from "@/services/applicant-profile.service";

const prismaClient = prisma as unknown as {
  program: {
    findMany: (args: unknown) => Promise<ProgramWithEligibilityRules[]>;
  };
  eligibilityResult: {
    upsert: (args: unknown) => Promise<unknown>;
  };
};

export interface EligibilityExplanation {
  programId: string;
  programName: string;
  programSlug: string;
  isEligible: boolean;
  score?: number;
  matched: string[];
  failed: string[];
  needsReview: boolean;
  ruleVersion?: number;
}

export interface RuleEvaluationResult {
  isEligible: boolean;
  score?: number;
  matched: string[];
  failed: string[];
  needsReview: boolean;
}

type ProgramWithEligibilityRules = Prisma.ProgramGetPayload<{ include: { eligibilityRules: true } }>;
type EligibilityRuleVersion = { version: number; isActive: boolean; rules: unknown };

const UNSURE_VALUES = new Set(["not_sure", "other", "prefer_not_to_say", "unknown", "unsure"]);

function describePath(path: unknown): string {
  if (typeof path === "string") {
    return path
      .split(".")
      .map((segment) => segment.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " "))
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
      .join(" ");
  }
  return "Field";
}

function isUncertainValue(value: unknown): boolean {
  if (typeof value === "string") {
    return UNSURE_VALUES.has(value.trim().toLowerCase());
  }
  return false;
}

function normalizeUnknownValue(value: unknown): unknown {
  if (isUncertainValue(value)) return undefined;
  return value;
}

function getRuleContextValue(source: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}

function containsUncertainValue(node: unknown, context: Record<string, unknown>): boolean {
  if (!node || typeof node !== "object") {
    return false;
  }

  if (Array.isArray(node)) {
    return node.some((child) => containsUncertainValue(child, context));
  }

  if (Object.prototype.hasOwnProperty.call(node, "var")) {
    const path = String((node as Record<string, unknown>).var);
    return isUncertainValue(getRuleContextValue(context, path));
  }

  return Object.values(node as Record<string, unknown>).some((value) => containsUncertainValue(value, context));
}

function formatValue(value: unknown): string {
  if (typeof value === "number") return new Intl.NumberFormat("en-US").format(value);
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value ?? "");
}

function describeRuleNode(node: unknown, profile: Record<string, unknown>): string[] {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return [];
  }

  if (Object.prototype.hasOwnProperty.call(node, "score")) {
    return [`Adds ${String((node as Record<string, unknown>).score)} points`];
  }

  if (Object.prototype.hasOwnProperty.call(node, "manual_review")) {
    return ["Requires manual review"];
  }

  const entries = Object.entries(node as Record<string, unknown>);
  const [operator, operand] = entries[0] ?? [];

  if (operator === "var") {
    return [String(operand)];
  }

  if (operator === "==") {
    const [left, right] = Array.isArray(operand) ? operand : [];
    const field = left && typeof left === "object" && "var" in (left as Record<string, unknown>) ? describePath((left as Record<string, unknown>).var) : "field";
    return [`${field} equals ${formatValue(right)}`];
  }

  if (operator === "!=" || operator === ">" || operator === ">=" || operator === "<" || operator === "<=") {
    const [left, right] = Array.isArray(operand) ? operand : [];
    const field = left && typeof left === "object" && "var" in (left as Record<string, unknown>) ? describePath((left as Record<string, unknown>).var) : "field";
    return [`${field} ${operator} ${formatValue(right)}`];
  }

  if (operator === "in") {
    const [left, right] = Array.isArray(operand) ? operand : [];
    const field = left && typeof left === "object" && "var" in (left as Record<string, unknown>) ? describePath((left as Record<string, unknown>).var) : "field";
    return [`${field} is in ${JSON.stringify(right)}`];
  }

  if (operator === "and" || operator === "or") {
    const values = Array.isArray(operand) ? operand : [];
    return values.flatMap((child) => describeRuleNode(child, profile));
  }

  if (operator === "not") {
    return describeRuleNode(operand, profile);
  }

  return [];
}

function buildRuleContext(profile: Record<string, unknown>): Record<string, unknown> {
  const personal = (profile.personal as Record<string, unknown> | undefined) ?? {};
  const income = (profile.income as Record<string, unknown> | undefined) ?? {};
  const household = (profile.household as Record<string, unknown> | undefined) ?? {};
  const preferences = (profile.preferences as Record<string, unknown> | undefined) ?? {};
  const employment = (profile.employment as Record<string, unknown> | undefined) ?? {};
  const employmentStatus = typeof income.employmentStatus === "string"
    ? income.employmentStatus
    : typeof employment.status === "string"
      ? employment.status
      : undefined;

  // Normalize housing goals - convert comma-separated string to array
  let housingGoals: string[] = [];
  if (typeof preferences.housingGoal === "string") {
    housingGoals = preferences.housingGoal.split(",").map((g) => g.trim()).filter(Boolean);
  } else if (Array.isArray(preferences.housingGoal)) {
    housingGoals = preferences.housingGoal.map(String).filter(Boolean);
  }

  // Normalize preferred locations
  let preferredLocations: string[] = [];
  if (Array.isArray(preferences.preferredLocations)) {
    preferredLocations = preferences.preferredLocations.map(String).filter(Boolean);
  } else if (typeof preferences.preferredLocations === "string") {
    preferredLocations = preferences.preferredLocations.split(",").map((loc) => loc.trim()).filter(Boolean);
  }

  return {
    personal: {
      ...personal,
      age: personal.dateOfBirth ? new Date().getFullYear() - new Date(String(personal.dateOfBirth)).getFullYear() : undefined,
      isVeteran: personal.isVeteran === true || personal.isVeteran === "true",
      isDisabilityAffected: personal.isDisabilityAffected === true || personal.isDisabilityAffected === "true",
      isPublicWorker: personal.isPublicWorker === true || personal.isPublicWorker === "true"
    },
    income: {
      monthly: typeof income.monthly === "number" ? income.monthly : typeof income.monthlyIncome === "number" ? income.monthlyIncome : undefined,
      incomeRange: typeof income.incomeRange === "string" ? income.incomeRange : undefined,
      employmentStatus,
      employer: income.employer,
      workHours: income.workHours,
      sourceOfIncome: income.sourceOfIncome
    },
    employment: {
      status: employmentStatus
    },
    household: {
      ...household,
      householdSize: typeof household.householdSize === "number" ? household.householdSize : undefined
    },
    preferences: {
      ...preferences,
      housingGoals,
      housingGoal: housingGoals.length > 0 ? housingGoals[0] : undefined,
      preferredLocations,
      bedrooms: typeof preferences.bedrooms === "number" ? preferences.bedrooms : undefined,
      maxRent: typeof preferences.maxRent === "number" ? preferences.maxRent : undefined
    },
    housing: {
      currentHousingSituation: (profile.housing as Record<string, unknown> | undefined)?.currentHousingSituation
    },
    meta: profile.meta ?? {}
  };
}

export function evaluateEligibilityRule(rule: unknown, profile: Record<string, unknown>): RuleEvaluationResult {
  const ruleContext = buildRuleContext(profile);

  if (
    rule &&
    typeof rule === "object" &&
    !Array.isArray(rule) &&
    "rules" in rule &&
    rule.rules &&
    typeof rule.rules === "object" &&
    !Array.isArray(rule.rules)
  ) {
    const definition = rule.rules as { type?: string; conditions?: unknown };
    const conditions = Array.isArray(definition.conditions) ? definition.conditions : [];
    const evaluations = conditions.map((condition) => {
      const item = condition as { field?: string; value?: unknown; operator?: string };
      const actual = typeof item.field === "string" ? getRuleContextValue(ruleContext, item.field) : undefined;
      const expected = item.value;
      let isMatch = false;

      switch (item.operator) {
        case "eq":
        case "equals":
          isMatch = actual === expected;
          break;
        case "neq":
        case "not_equals":
          isMatch = actual !== expected;
          break;
        case "gt":
          isMatch = Number(actual) > Number(expected);
          break;
        case "gte":
          isMatch = Number(actual) >= Number(expected);
          break;
        case "lt":
          isMatch = Number(actual) < Number(expected);
          break;
        case "lte":
          isMatch = Number(actual) <= Number(expected);
          break;
        case "in":
          isMatch = Array.isArray(expected) && expected.includes(actual);
          break;
        default:
          isMatch = false;
      }

      return {
        isMatch,
        description: `${describePath(item.field)} ${item.operator ?? "matches"} ${formatValue(expected)}`
      };
    });

    const isEligible = definition.type === "all"
      ? evaluations.length > 0 && evaluations.every((item) => item.isMatch)
      : evaluations.some((item) => item.isMatch);
    const matched = evaluations.filter((item) => item.isMatch).map((item) => item.description);
    const failed = evaluations.filter((item) => !item.isMatch).map((item) => item.description);

    return {
      isEligible,
      matched,
      failed,
      needsReview: false
    };
  }

  const evaluateNode = (node: unknown): RuleEvaluationResult => {
    if (!node || typeof node !== "object" || Array.isArray(node)) {
      return {
        isEligible: Boolean(jsonLogic.apply(node, ruleContext)),
        matched: [],
        failed: [],
        needsReview: false
      };
    }

    if (Object.prototype.hasOwnProperty.call(node, "score")) {
      const value = Number((node as Record<string, unknown>).score);
      return {
        isEligible: true,
        score: Number.isFinite(value) ? value : 0,
        matched: describeRuleNode(node, profile),
        failed: [],
        needsReview: false
      };
    }

    if (Object.prototype.hasOwnProperty.call(node, "manual_review")) {
      return {
        isEligible: true,
        matched: describeRuleNode(node, profile),
        failed: [],
        needsReview: true
      };
    }

    if (containsUncertainValue(node, ruleContext)) {
      return {
        isEligible: true,
        matched: [],
        failed: [],
        needsReview: true
      };
    }

    const entries = Object.entries(node as Record<string, unknown>);
    const [operator, operand] = entries[0] ?? [];

    if (operator === "and" || operator === "or") {
      const children = Array.isArray(operand) ? operand : [];
      const results = children.map((child) => evaluateNode(child));
      const matched = results.flatMap((result) => result.matched);
      const failed = results.flatMap((result) => result.failed);
      const overallEligible = operator === "and" ? results.every((result) => result.isEligible) : results.some((result) => result.isEligible);
      const score = results.reduce((total, result) => total + (result.score ?? 0), 0);
      const needsReview = results.some((result) => result.needsReview);

      return {
        isEligible: overallEligible,
        score: score || undefined,
        matched: overallEligible ? matched : [],
        failed: overallEligible ? [] : failed.length > 0 ? failed : ["Rule did not match"],
        needsReview
      };
    }

    if (operator === "not") {
      const child = evaluateNode(operand);
      return {
        isEligible: !child.isEligible,
        score: child.score,
        matched: child.isEligible ? [] : describeRuleNode(node, profile),
        failed: child.isEligible ? describeRuleNode(node, profile) : [],
        needsReview: child.needsReview
      };
    }

    const normalizedRuleContext = Object.fromEntries(
      Object.entries(ruleContext).map(([key, value]) => [key, value])
    ) as Record<string, unknown>;

    const result = jsonLogic.apply(node, normalizedRuleContext);
    const descriptions = describeRuleNode(node, profile);
    const isMatch = Boolean(result);
    return {
      isEligible: isMatch,
      score: undefined,
      matched: isMatch ? descriptions : [],
      failed: isMatch ? [] : descriptions,
      needsReview: isMatch ? false : descriptions.length > 0
    };
  };

  const evaluation = evaluateNode(rule);
  return {
    ...evaluation,
    matched: evaluation.matched.length > 0 ? evaluation.matched : evaluation.isEligible ? ["Rule matched"] : []
  };
}

export function resolveActiveRule(versions: EligibilityRuleVersion[]) {
  return versions.filter((rule) => rule.isActive).sort((left, right) => right.version - left.version)[0] ?? null;
}

export async function runEligibilityEngine(userId: string): Promise<EligibilityExplanation[]> {
  const profile = await loadApplicantProfile(userId);
  const results = await evaluateEligibilityForProfile(profile as Record<string, unknown>);

  await Promise.all(results.map(async (result) => {
    await prismaClient.eligibilityResult.upsert({
      where: {
        userId_programId: {
          userId,
          programId: result.programId
        }
      },
      update: {
        isEligible: result.isEligible,
        score: result.score ?? null,
        reason: {
          matched: result.matched,
          failed: result.failed,
          score_breakdown: result.score ? [result.score] : []
        },
        ruleVersion: result.ruleVersion ?? 1,
        needsReview: result.needsReview
      },
      create: {
        userId,
        programId: result.programId,
        isEligible: result.isEligible,
        score: result.score ?? null,
        reason: {
          matched: result.matched,
          failed: result.failed,
          score_breakdown: result.score ? [result.score] : []
        },
        ruleVersion: result.ruleVersion ?? 1,
        needsReview: result.needsReview
      }
    });
  }));

  publishDomainEvent("eligibility.assessed", {
    userId,
    matchCount: results.filter((item) => item.isEligible).length,
    topProgram: results.find((item) => item.isEligible)?.programName,
  });

  return results;
}

export async function evaluateEligibilityForProfile(profile: Record<string, unknown>): Promise<EligibilityExplanation[]> {
  const ruleContext = buildRuleContext(profile as Record<string, unknown>);

  const isDevelopment = process.env.NODE_ENV === "development" || process.env.DEBUG_ELIGIBILITY === "true";

  if (isDevelopment) {
    console.log("\n🔍 [Eligibility Engine] Running profile evaluation");
    console.log("📋 [Profile Context]:", JSON.stringify(ruleContext, null, 2));
  }

  const orgContext = process.env.DEFAULT_ORGANIZATION_ID ?? "default-org";
  const programs = (await prismaClient.program.findMany({
    where: {
      status: "active",
      organizationId: orgContext
    },
    include: {
      eligibilityRules: {
        where: { isActive: true },
        orderBy: { version: "desc" }
      }
    }
  })) as ProgramWithEligibilityRules[];

  if (isDevelopment) {
    console.log(`\n📦 [Programs Found]: ${programs.length} active programs`);
    programs.forEach((p) => {
      console.log(`  - ${p.name} (${p.slug}) - ${p.eligibilityRules?.length ?? 0} active rules`);
    });
  }

  if (programs.length === 0) {
    console.warn("⚠️  [Eligibility Engine] No active programs found in organization:", orgContext);
    console.warn("   Check that programs exist with status='active' and organizationId matches DEFAULT_ORGANIZATION_ID");
    return [];
  }

  const results = await Promise.all(
    programs.map(async (program: ProgramWithEligibilityRules) => {
      const activeRule = resolveActiveRule(program.eligibilityRules as EligibilityRuleVersion[]);
      const rule = activeRule?.rules as unknown;
      
      if (isDevelopment) {
        console.log(`\n🎯 [Evaluating] ${program.name}`);
        console.log(`   Active Rule: ${activeRule ? `v${activeRule.version}` : "none"}`);
        if (activeRule && rule) {
          console.log(`   Rule:`, JSON.stringify(rule, null, 2));
        }
      }

      const evaluation = rule ? evaluateEligibilityRule(rule, ruleContext) : { isEligible: false, matched: [], failed: ["No active eligibility rules configured."], needsReview: false };

      if (isDevelopment) {
        console.log(`   Result: ${evaluation.isEligible ? "✅ ELIGIBLE" : "❌ NOT ELIGIBLE"}`);
        console.log(`   Score: ${evaluation.score ?? "N/A"}`);
        console.log(`   Matched: ${evaluation.matched.join(", ") || "none"}`);
        console.log(`   Failed: ${evaluation.failed.join(", ") || "none"}`);
      }

      const explanation: EligibilityExplanation = {
        programId: program.id,
        programName: program.name,
        programSlug: program.slug,
        isEligible: evaluation.isEligible,
        score: evaluation.score,
        matched: evaluation.matched.length > 0 ? evaluation.matched : evaluation.isEligible ? ["Rule matched"] : [],
        failed: evaluation.failed.length > 0 ? evaluation.failed : evaluation.isEligible ? [] : ["Rule did not match"],
        needsReview: evaluation.needsReview,
        ruleVersion: activeRule?.version ?? 1
      };

      return explanation;
    })
  );

  const eligibleCount = results.filter((item: EligibilityExplanation) => item.isEligible).length;

  if (isDevelopment) {
    console.log(`\n✨ [Final Results]: ${eligibleCount} eligible / ${results.length} total programs`);
  }

  return results.sort((left: EligibilityExplanation, right: EligibilityExplanation) => Number(right.isEligible) - Number(left.isEligible) || Number(right.score ?? 0) - Number(left.score ?? 0));
}

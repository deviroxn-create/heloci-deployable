import jsonLogic from "json-logic-js";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { notificationService } from "@/lib/notifications/notification.service";
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

  return {
    personal: {
      ...personal,
      age: personal.dateOfBirth ? new Date().getFullYear() - new Date(String(personal.dateOfBirth)).getFullYear() : undefined
    },
    income: {
      monthly: typeof income.monthly === "number" ? income.monthly : typeof income.monthlyIncome === "number" ? income.monthlyIncome : undefined,
      employmentStatus,
      employer: income.employer,
      workHours: income.workHours,
      sourceOfIncome: income.sourceOfIncome
    },
    employment: {
      status: employmentStatus
    },
    household,
    preferences,
    meta: profile.meta ?? {}
  };
}

export function evaluateEligibilityRule(rule: unknown, profile: Record<string, unknown>): RuleEvaluationResult {
  const ruleContext = buildRuleContext(profile);

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

    const result = jsonLogic.apply(node, ruleContext);
    const descriptions = describeRuleNode(node, profile);
    return {
      isEligible: Boolean(result),
      score: undefined,
      matched: Boolean(result) ? descriptions : [],
      failed: Boolean(result) ? [] : descriptions,
      needsReview: false
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
  const ruleContext = buildRuleContext(profile as Record<string, unknown>);

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

  const results = await Promise.all(
    programs.map(async (program: ProgramWithEligibilityRules) => {
      const activeRule = resolveActiveRule(program.eligibilityRules as EligibilityRuleVersion[]);
      const rule = activeRule?.rules as unknown;
      const evaluation = rule ? evaluateEligibilityRule(rule, ruleContext) : { isEligible: false, matched: [], failed: ["No active eligibility rules configured."], needsReview: false };

      const explanation: EligibilityExplanation = {
        programId: program.id,
        programName: program.name,
        programSlug: program.slug,
        isEligible: evaluation.isEligible,
        score: evaluation.score,
        matched: evaluation.matched.length > 0 ? evaluation.matched : evaluation.isEligible ? ["Rule matched"] : [],
        failed: evaluation.failed.length > 0 ? evaluation.failed : evaluation.isEligible ? [] : ["Rule did not match"],
        needsReview: evaluation.needsReview
      };

      await prismaClient.eligibilityResult.upsert({
        where: {
          userId_programId: {
            userId,
            programId: program.id
          }
        },
        update: {
          isEligible: explanation.isEligible,
          score: explanation.score ?? null,
          reason: {
            matched: explanation.matched,
            failed: explanation.failed,
            score_breakdown: explanation.score ? [explanation.score] : []
          },
          ruleVersion: activeRule?.version ?? 1
        },
        create: {
          userId,
          programId: program.id,
          isEligible: explanation.isEligible,
          score: explanation.score ?? null,
          reason: {
            matched: explanation.matched,
            failed: explanation.failed,
            score_breakdown: explanation.score ? [explanation.score] : []
          },
          ruleVersion: activeRule?.version ?? 1
        }
      });

      return explanation;
    })
  );

  await notificationService.notify("eligibility_assessment_completed", {
    userId,
    matchCount: results.filter((item: EligibilityExplanation) => item.isEligible).length,
    topProgram: results.find((item: EligibilityExplanation) => item.isEligible)?.programName
  });

  return results.sort((left: EligibilityExplanation, right: EligibilityExplanation) => Number(right.isEligible) - Number(left.isEligible) || Number(right.score ?? 0) - Number(left.score ?? 0));
}

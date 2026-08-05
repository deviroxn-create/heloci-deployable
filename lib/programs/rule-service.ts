import jsonLogic from "json-logic-js";
import { prisma } from "@/lib/prisma/client";

export interface ProgramEligibilityRuleInput {
  name?: string;
  version?: number;
  rules: unknown;
  explanation?: string;
  weight?: number;
  order?: number;
}

export function validateEligibilityRule(rule: unknown) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    return { valid: false, error: "Invalid rule payload." };
  }

  try {
    jsonLogic.apply(rule, {});
    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Rule must be valid JSON Logic." };
  }
}

export async function createEligibilityRule(programId: string, staffUserId: string, input: ProgramEligibilityRuleInput) {
  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program) {
    throw new Error("program_not_found");
  }

  // Authorization must be enforced at the API / server-action layer.
  // Service enforces ownership and business rules only.

  const versionAggregate = await prisma.eligibilityRule.aggregate({
    where: { programId },
    _max: { version: true }
  });

  const nextVersion = input.version ?? ((versionAggregate._max.version ?? 0) + 1);

  await prisma.eligibilityRule.updateMany({
    where: { programId, isActive: true },
    data: { isActive: false }
  });

  const rule = await prisma.eligibilityRule.create({
    data: {
      programId,
      version: nextVersion,
      name: input.name ?? `v${nextVersion}`,
      rules: input.rules as any,
      explanation: input.explanation,
      weight: input.weight ?? 1,
      order: input.order ?? 0,
      isActive: true,
      createdBy: staffUserId
    }
  });

  await prisma.programEvent.create({
    data: {
      programId,
      type: "eligibility_rule_created",
      actorId: staffUserId,
      metadata: {
        ruleId: rule.id,
        version: rule.version,
        name: rule.name
      }
    }
  });

  return rule;
}

export async function getActiveEligibilityRule(programId: string) {
  return prisma.eligibilityRule.findFirst({
    where: { programId, isActive: true },
    orderBy: { version: "desc" }
  });
}

export async function listProgramEligibilityRules(programId: string) {
  return prisma.eligibilityRule.findMany({
    where: { programId },
    orderBy: [{ version: "desc" }, { createdAt: "desc" }]
  });
}

export async function validateProgramRulePublishing(programId: string) {
  const activeRule = await prisma.eligibilityRule.findFirst({
    where: { programId, isActive: true }
  });

  return {
    hasActiveRule: Boolean(activeRule),
    ready: Boolean(activeRule)
  };
}

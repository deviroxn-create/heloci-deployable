"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEligibilityRule = validateEligibilityRule;
exports.createEligibilityRule = createEligibilityRule;
exports.getActiveEligibilityRule = getActiveEligibilityRule;
exports.listProgramEligibilityRules = listProgramEligibilityRules;
exports.validateProgramRulePublishing = validateProgramRulePublishing;
const json_logic_js_1 = __importDefault(require("json-logic-js"));
const client_1 = require("@/lib/prisma/client");
const rbac_1 = require("@/lib/auth/rbac");
function validateEligibilityRule(rule) {
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
        return { valid: false, error: "Invalid rule payload." };
    }
    try {
        json_logic_js_1.default.apply(rule, {});
        return { valid: true };
    }
    catch (error) {
        return { valid: false, error: "Rule must be valid JSON Logic." };
    }
}
async function createEligibilityRule(programId, staffUserId, input) {
    const program = await client_1.prisma.program.findUnique({ where: { id: programId } });
    if (!program) {
        throw new Error("program_not_found");
    }
    await (0, rbac_1.requireOrgRole)(staffUserId, program.organizationId, ["org_admin"]);
    const versionAggregate = await client_1.prisma.eligibilityRule.aggregate({
        where: { programId },
        _max: { version: true }
    });
    const nextVersion = input.version ?? ((versionAggregate._max.version ?? 0) + 1);
    await client_1.prisma.eligibilityRule.updateMany({
        where: { programId, isActive: true },
        data: { isActive: false }
    });
    const rule = await client_1.prisma.eligibilityRule.create({
        data: {
            programId,
            version: nextVersion,
            name: input.name ?? `v${nextVersion}`,
            rules: input.rules,
            explanation: input.explanation,
            weight: input.weight ?? 1,
            order: input.order ?? 0,
            isActive: true,
            createdBy: staffUserId
        }
    });
    await client_1.prisma.programEvent.create({
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
async function getActiveEligibilityRule(programId) {
    return client_1.prisma.eligibilityRule.findFirst({
        where: { programId, isActive: true },
        orderBy: { version: "desc" }
    });
}
async function listProgramEligibilityRules(programId) {
    return client_1.prisma.eligibilityRule.findMany({
        where: { programId },
        orderBy: [{ version: "desc" }, { createdAt: "desc" }]
    });
}
async function validateProgramRulePublishing(programId) {
    const activeRule = await client_1.prisma.eligibilityRule.findFirst({
        where: { programId, isActive: true }
    });
    return {
        hasActiveRule: Boolean(activeRule),
        ready: Boolean(activeRule)
    };
}

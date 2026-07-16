"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateEligibilityRule = evaluateEligibilityRule;
exports.resolveActiveRule = resolveActiveRule;
exports.runEligibilityEngine = runEligibilityEngine;
const json_logic_js_1 = __importDefault(require("json-logic-js"));
const client_1 = require("@/lib/prisma/client");
const notification_service_1 = require("@/lib/notifications/notification.service");
const applicant_profile_service_1 = require("@/services/applicant-profile.service");
const prismaClient = client_1.prisma;
function describePath(path) {
    if (typeof path === "string") {
        return path
            .split(".")
            .map((segment) => segment.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " "))
            .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
            .join(" ");
    }
    return "Field";
}
function formatValue(value) {
    if (typeof value === "number")
        return new Intl.NumberFormat("en-US").format(value);
    if (typeof value === "string")
        return value;
    if (typeof value === "boolean")
        return value ? "true" : "false";
    return String(value ?? "");
}
function describeRuleNode(node, profile) {
    if (!node || typeof node !== "object" || Array.isArray(node)) {
        return [];
    }
    if (Object.prototype.hasOwnProperty.call(node, "score")) {
        return [`Adds ${String(node.score)} points`];
    }
    if (Object.prototype.hasOwnProperty.call(node, "manual_review")) {
        return ["Requires manual review"];
    }
    const entries = Object.entries(node);
    const [operator, operand] = entries[0] ?? [];
    if (operator === "var") {
        return [String(operand)];
    }
    if (operator === "==") {
        const [left, right] = Array.isArray(operand) ? operand : [];
        const field = left && typeof left === "object" && "var" in left ? describePath(left.var) : "field";
        return [`${field} equals ${formatValue(right)}`];
    }
    if (operator === "!=" || operator === ">" || operator === ">=" || operator === "<" || operator === "<=") {
        const [left, right] = Array.isArray(operand) ? operand : [];
        const field = left && typeof left === "object" && "var" in left ? describePath(left.var) : "field";
        return [`${field} ${operator} ${formatValue(right)}`];
    }
    if (operator === "in") {
        const [left, right] = Array.isArray(operand) ? operand : [];
        const field = left && typeof left === "object" && "var" in left ? describePath(left.var) : "field";
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
function buildRuleContext(profile) {
    const personal = profile.personal ?? {};
    const income = profile.income ?? {};
    const household = profile.household ?? {};
    const preferences = profile.preferences ?? {};
    const employment = profile.employment ?? {};
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
function evaluateEligibilityRule(rule, profile) {
    const ruleContext = buildRuleContext(profile);
    const evaluateNode = (node) => {
        if (!node || typeof node !== "object" || Array.isArray(node)) {
            return {
                isEligible: Boolean(json_logic_js_1.default.apply(node, ruleContext)),
                matched: [],
                failed: [],
                needsReview: false
            };
        }
        if (Object.prototype.hasOwnProperty.call(node, "score")) {
            const value = Number(node.score);
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
        const entries = Object.entries(node);
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
        const result = json_logic_js_1.default.apply(node, ruleContext);
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
function resolveActiveRule(versions) {
    return versions.filter((rule) => rule.isActive).sort((left, right) => right.version - left.version)[0] ?? null;
}
async function runEligibilityEngine(userId) {
    const profile = await (0, applicant_profile_service_1.loadApplicantProfile)(userId);
    const ruleContext = buildRuleContext(profile);
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
    }));
    const results = await Promise.all(programs.map(async (program) => {
        const activeRule = resolveActiveRule(program.eligibilityRules);
        const rule = activeRule?.rules;
        const evaluation = rule ? evaluateEligibilityRule(rule, ruleContext) : { isEligible: false, matched: [], failed: ["No active eligibility rules configured."], needsReview: false };
        const explanation = {
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
    }));
    await notification_service_1.notificationService.notify("eligibility_assessment_completed", {
        userId,
        matchCount: results.filter((item) => item.isEligible).length,
        topProgram: results.find((item) => item.isEligible)?.programName
    });
    return results.sort((left, right) => Number(right.isEligible) - Number(left.isEligible) || Number(right.score ?? 0) - Number(left.score ?? 0));
}

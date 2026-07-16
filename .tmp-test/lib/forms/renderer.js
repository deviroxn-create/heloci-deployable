"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFormForProgram = getFormForProgram;
exports.evaluateCondition = evaluateCondition;
const json_logic_js_1 = __importDefault(require("json-logic-js"));
const client_1 = require("@/lib/prisma/client");
const applicant_profile_service_1 = require("@/services/applicant-profile.service");
async function getFormForProgram(programSlug, userId) {
    const program = (await client_1.prisma.program.findFirst({
        where: { slug: programSlug },
        include: {
            questionSets: {
                where: { isActive: true },
                orderBy: { version: "desc" },
                take: 1,
                include: {
                    pages: {
                        orderBy: { sortOrder: "asc" },
                        include: {
                            questions: {
                                orderBy: { order: "asc" },
                                include: { conditions: true }
                            }
                        }
                    }
                }
            }
        }
    }));
    if (!program?.questionSets?.[0]) {
        return { pages: [], applicationId: "", currentPage: 0, totalPages: 0, programName: program?.name ?? "" };
    }
    const profile = await (0, applicant_profile_service_1.loadApplicantProfile)(userId);
    let application = await client_1.prisma.programApplication.findFirst({
        where: { userId, programId: program.id, status: "draft" }
    });
    if (!application) {
        application = await client_1.prisma.programApplication.create({
            data: {
                userId,
                programId: program.id,
                status: "draft",
                data: {},
                currentPage: 0
            }
        });
    }
    const activeQuestionSet = program.questionSets[0];
    const pages = (activeQuestionSet.pages ?? []).map((page) => {
        const questions = page.questions
            .map((question) => {
            const context = {
                profile,
                application: application?.data
            };
            const visible = !(question.conditions && question.conditions.length > 0)
                ? true
                : evaluateCondition(question.conditions[0].rules, context);
            const hasApplicationValue = Boolean(application?.data?.[question.key]);
            const prefilledValue = question.isUniversal && question.profileField
                ? (getNestedValue(profile, question.profileField) ?? (hasApplicationValue ? (application?.data)[question.key] : undefined))
                : hasApplicationValue
                    ? (application?.data)[question.key]
                    : undefined;
            return {
                id: question.id,
                key: question.key,
                label: question.label,
                type: question.type,
                required: question.required,
                value: prefilledValue,
                visible,
                options: Array.isArray(question.options) ? question.options : undefined,
                validation: question.validation,
                helpText: question.helpText ?? undefined
            };
        })
            .filter((question) => question.visible);
        return {
            id: page.id,
            title: page.title,
            description: page.description,
            questions
        };
    }).filter((page) => page.questions.length > 0);
    return {
        pages,
        applicationId: application.id,
        currentPage: application.currentPage ?? 0,
        totalPages: pages.length,
        programName: program.name
    };
}
function evaluateCondition(rules, context) {
    return Boolean(json_logic_js_1.default.apply(rules, context));
}
function getNestedValue(profile, profileField) {
    return profileField.split(".").reduce((current, segment) => {
        if (current && typeof current === "object" && segment in current) {
            return current[segment];
        }
        return undefined;
    }, profile);
}

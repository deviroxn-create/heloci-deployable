"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuestionSetPayload = validateQuestionSetPayload;
exports.publishQuestionSet = publishQuestionSet;
exports.getActiveQuestionSet = getActiveQuestionSet;
exports.validateQuestionSetPublishReady = validateQuestionSetPublishReady;
const client_1 = require("@/lib/prisma/client");
const rbac_1 = require("@/lib/auth/rbac");
function validateQuestionSetPayload(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        return { valid: false, error: "Invalid question set payload." };
    }
    const payload = input;
    if (!Array.isArray(payload.pages) || payload.pages.length === 0) {
        return { valid: false, error: "Question set must contain at least one page." };
    }
    for (const page of payload.pages) {
        if (!page || typeof page !== "object") {
            return { valid: false, error: "Each page must be an object." };
        }
        const pageRecord = page;
        if (!pageRecord.title || typeof pageRecord.title !== "string") {
            return { valid: false, error: "Each page must have a title." };
        }
        if (typeof pageRecord.sortOrder !== "number") {
            return { valid: false, error: "Each page must have a sortOrder." };
        }
        if (!Array.isArray(pageRecord.questions) || pageRecord.questions.length === 0) {
            return { valid: false, error: "Each page must contain at least one question." };
        }
        for (const question of pageRecord.questions) {
            if (!question || typeof question !== "object") {
                return { valid: false, error: "Each question must be an object." };
            }
            const questionRecord = question;
            if (!questionRecord.key || typeof questionRecord.key !== "string") {
                return { valid: false, error: "Each question must have a key." };
            }
            if (!questionRecord.label || typeof questionRecord.label !== "string") {
                return { valid: false, error: "Each question must have a label." };
            }
            if (!questionRecord.type || typeof questionRecord.type !== "string") {
                return { valid: false, error: "Each question must have a type." };
            }
        }
    }
    return { valid: true };
}
async function publishQuestionSet(programId, staffUserId, input) {
    const program = await client_1.prisma.program.findUnique({ where: { id: programId } });
    if (!program) {
        throw new Error("program_not_found");
    }
    await (0, rbac_1.requireOrgRole)(staffUserId, program.organizationId, ["org_admin"]);
    const versionAggregate = await client_1.prisma.questionSet.aggregate({
        where: { programId },
        _max: { version: true }
    });
    const nextVersion = input.version ?? ((versionAggregate._max.version ?? 0) + 1);
    await client_1.prisma.questionSet.updateMany({
        where: { programId, isActive: true },
        data: { isActive: false }
    });
    const questionSet = await client_1.prisma.questionSet.create({
        data: {
            programId,
            name: input.name ?? "Application Form",
            version: nextVersion,
            isActive: true,
            pages: {
                // cast to any because nested create types are complex and inferred from Prisma client
                create: input.pages.map((page) => ({
                    title: page.title,
                    description: page.description,
                    sortOrder: page.sortOrder,
                    questions: {
                        create: page.questions.map((question) => ({
                            key: question.key,
                            label: question.label,
                            type: question.type,
                            description: question.description,
                            placeholder: question.placeholder,
                            required: question.required ?? false,
                            options: question.options,
                            validation: question.validation,
                            conditional: question.conditional,
                            profileMapping: question.profileMapping,
                            order: question.order ?? 0,
                            page: question.page ?? 0,
                            section: question.section,
                            helpText: question.helpText,
                            optionsRaw: question.optionsRaw,
                            validationRaw: question.validationRaw,
                            isUniversal: question.isUniversal ?? false,
                            profileField: question.profileField,
                            conditions: question.conditions?.length
                                ? {
                                    create: question.conditions.map((condition) => ({
                                        type: condition.type,
                                        rules: condition.rules
                                    }))
                                }
                                : undefined
                        }))
                    }
                }))
            }
        },
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
    });
    await client_1.prisma.programEvent.create({
        data: {
            programId,
            type: "question_set_published",
            actorId: staffUserId,
            metadata: {
                questionSetId: questionSet.id,
                version: questionSet.version,
                name: questionSet.name
            }
        }
    });
    return questionSet;
}
async function getActiveQuestionSet(programId) {
    return client_1.prisma.questionSet.findFirst({
        where: { programId, isActive: true },
        orderBy: { version: "desc" },
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
    });
}
async function validateQuestionSetPublishReady(programId) {
    const activeSet = await client_1.prisma.questionSet.findFirst({
        where: { programId, isActive: true }
    });
    return {
        hasActiveQuestionSet: Boolean(activeSet),
        ready: Boolean(activeSet)
    };
}

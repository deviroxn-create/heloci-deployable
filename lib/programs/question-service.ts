import { prisma } from "@/lib/prisma/client";
import { requireOrgRole } from "@/lib/auth/rbac";

export interface QuestionConditionInput {
  type: string;
  rules: unknown;
}

export interface QuestionFieldInput {
  key: string;
  label: string;
  type: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  options?: unknown;
  validation?: unknown;
  conditional?: unknown;
  profileMapping?: string;
  order?: number;
  page?: number;
  section?: string;
  helpText?: string;
  optionsRaw?: unknown;
  validationRaw?: unknown;
  isUniversal?: boolean;
  profileField?: string;
  conditions?: QuestionConditionInput[];
}

export interface QuestionPageInput {
  title: string;
  description?: string;
  sortOrder: number;
  questions: QuestionFieldInput[];
}

export interface QuestionSetInput {
  name?: string;
  version?: number;
  pages: QuestionPageInput[];
}

export function validateQuestionSetPayload(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, error: "Invalid question set payload." };
  }

  const payload = input as { pages?: unknown };
  if (!Array.isArray(payload.pages) || payload.pages.length === 0) {
    return { valid: false, error: "Question set must contain at least one page." };
  }

  for (const page of payload.pages as unknown[]) {
    if (!page || typeof page !== "object") {
      return { valid: false, error: "Each page must be an object." };
    }

    const pageRecord = page as { title?: unknown; sortOrder?: unknown; questions?: unknown };
    if (!pageRecord.title || typeof pageRecord.title !== "string") {
      return { valid: false, error: "Each page must have a title." };
    }
    if (typeof pageRecord.sortOrder !== "number") {
      return { valid: false, error: "Each page must have a sortOrder." };
    }
    if (!Array.isArray(pageRecord.questions) || pageRecord.questions.length === 0) {
      return { valid: false, error: "Each page must contain at least one question." };
    }

    for (const question of pageRecord.questions as unknown[]) {
      if (!question || typeof question !== "object") {
        return { valid: false, error: "Each question must be an object." };
      }

      const questionRecord = question as { key?: unknown; label?: unknown; type?: unknown };
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

export async function publishQuestionSet(programId: string, staffUserId: string, input: QuestionSetInput) {
  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program) {
    throw new Error("program_not_found");
  }

  await requireOrgRole(staffUserId, program.organizationId, ["org_admin"]);

  const versionAggregate = await prisma.questionSet.aggregate({
    where: { programId },
    _max: { version: true }
  });

  const nextVersion = input.version ?? ((versionAggregate._max.version ?? 0) + 1);

  await prisma.questionSet.updateMany({
    where: { programId, isActive: true },
    data: { isActive: false }
  });

  const questionSet = await prisma.questionSet.create({
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
              options: question.options as any,
              validation: question.validation as any,
              conditional: question.conditional as any,
              profileMapping: question.profileMapping,
              order: question.order ?? 0,
              page: question.page ?? 0,
              section: question.section,
              helpText: question.helpText,
              optionsRaw: question.optionsRaw as any,
              validationRaw: question.validationRaw as any,
              isUniversal: question.isUniversal ?? false,
              profileField: question.profileField,
              conditions: question.conditions?.length
                ? ({
                    create: question.conditions.map((condition) => ({
                      type: condition.type,
                      rules: condition.rules as any
                    }))
                  } as any)
                : undefined
            })) as any
          }
        })) as any
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

  await prisma.programEvent.create({
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

export async function getActiveQuestionSet(programId: string) {
  return prisma.questionSet.findFirst({
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

export async function validateQuestionSetPublishReady(programId: string) {
  const activeSet = await prisma.questionSet.findFirst({
    where: { programId, isActive: true }
  });

  return {
    hasActiveQuestionSet: Boolean(activeSet),
    ready: Boolean(activeSet)
  };
}

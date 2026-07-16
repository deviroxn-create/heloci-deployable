import jsonLogic from "json-logic-js";
import { prisma } from "@/lib/prisma/client";
import { loadApplicantProfile } from "@/services/applicant-profile.service";

export interface FormContext {
  profile: Record<string, unknown>;
  application: Record<string, unknown>;
  eligibilityResult?: Record<string, unknown>;
}

export interface RenderedQuestion {
  id: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  value: unknown;
  visible: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: Record<string, unknown>;
  helpText?: string;
}

interface FormQuestionRecord {
  id: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string | null;
  helpText?: string | null;
  options?: unknown;
  validation?: unknown;
  isUniversal?: boolean;
  profileField?: string | null;
  conditions?: Array<{ rules: unknown }>;
}

interface FormPageRecord {
  id: string;
  title: string;
  description?: string | null;
  questions: FormQuestionRecord[];
}

interface ProgramWithFormData {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
  questionSets?: Array<{
    id: string;
    version: number;
    isActive: boolean;
    pages?: FormPageRecord[];
  }>;
}

export async function getFormForProgram(programSlug: string, userId: string) {
  const program = (await prisma.program.findFirst({
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
  })) as ProgramWithFormData | null;

  if (!program?.questionSets?.[0]) {
    return { pages: [], applicationId: "", currentPage: 0, totalPages: 0, programName: program?.name ?? "" };
  }

  const profile = await loadApplicantProfile(userId);
  let application = await prisma.programApplication.findFirst({
    where: { userId, programId: program.id, status: "draft" }
  });

  if (!application) {
    application = await prisma.programApplication.create({
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
          application: application?.data as Record<string, unknown>
        };

        const visible = !(question.conditions && question.conditions.length > 0)
          ? true
          : evaluateCondition(question.conditions![0].rules, context);

        const hasApplicationValue = Boolean((application?.data as Record<string, unknown> | undefined)?.[question.key]);
        const prefilledValue = question.isUniversal && question.profileField
          ? (getNestedValue(profile, question.profileField as string) ?? (hasApplicationValue ? (application?.data as Record<string, unknown>)[question.key] : undefined))
          : hasApplicationValue
            ? (application?.data as Record<string, unknown>)[question.key]
            : undefined;

        return {
          id: question.id,
          key: question.key,
          label: question.label,
          type: question.type,
          required: question.required,
          value: prefilledValue,
          visible,
          options: Array.isArray(question.options) ? (question.options as Array<{ value: string; label: string }>) : undefined,
          validation: question.validation as Record<string, unknown> | undefined,
          helpText: question.helpText ?? undefined
        } as RenderedQuestion;
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

export function evaluateCondition(rules: unknown, context: FormContext): boolean {
  return Boolean(jsonLogic.apply(rules, context));
}

function getNestedValue(profile: Record<string, unknown>, profileField: string) {
  return profileField.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, profile as unknown);
}

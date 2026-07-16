import { z } from "zod";
import type { RenderedQuestion } from "./renderer";

function createFieldSchema(question: RenderedQuestion) {
  const validation = (question.validation as Record<string, unknown> | undefined) ?? {};
  const minValue = typeof validation.min === "number" ? validation.min : undefined;
  const maxValue = typeof validation.max === "number" ? validation.max : undefined;
  const regexValue = typeof validation.regex === "string" ? validation.regex : undefined;
  let schema: z.ZodTypeAny = z.string();

  if (question.type === "number") {
    schema = z.coerce.number();
    if (typeof minValue === "number") {
      schema = schema.refine((value) => Number(value) >= minValue, `${question.label} must be at least ${minValue}`);
    }
    if (typeof maxValue === "number") {
      schema = schema.refine((value) => Number(value) <= maxValue, `${question.label} must be at most ${maxValue}`);
    }
  }

  if (question.required) {
    if (question.type === "number") {
      schema = schema.refine((value) => value !== undefined && value !== null && value !== "", { message: `${question.label} is required.` });
    } else {
      schema = z.string().min(1, `${question.label} is required.`);
    }
  }

  if (typeof regexValue === "string") {
    schema = schema.refine((value) => new RegExp(regexValue).test(String(value)), (validation.errorMessage as string) || `${question.label} is invalid.`);
  }

  return schema;
}

export function buildZodSchema(questions: RenderedQuestion[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  questions.forEach((question) => {
    shape[question.key] = createFieldSchema(question);
  });
  return z.object(shape);
}

export function validatePage(questions: RenderedQuestion[], data: Record<string, unknown>) {
  const schema = buildZodSchema(questions);
  const result = schema.safeParse(data);
  if (result.success) {
    return { valid: true, errors: {} };
  }

  const errors = Object.fromEntries(
    Object.entries(result.error.flatten().fieldErrors).map(([key, value]) => [key, value?.[0] ?? "Invalid value"])
  );

  return { valid: false, errors };
}

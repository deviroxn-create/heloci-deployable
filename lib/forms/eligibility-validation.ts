import { z } from "zod";
import type { RenderedQuestion } from "./renderer";
import { createFieldSchema, buildZodSchema } from "./validator";

export interface QuestionValidationResult {
  valid: boolean;
  error?: string;
}

export function validateQuestionValue(question: RenderedQuestion, value: unknown): QuestionValidationResult {
  const fieldSchema = createFieldSchema(question);
  const result = fieldSchema.safeParse(value);

  if (result.success) {
    return { valid: true };
  }

  const issue = result.error.issues[0];
  return {
    valid: false,
    error: issue?.message ?? "Please answer this question."
  };
}

export function validateQuestions(questions: RenderedQuestion[], values: Record<string, unknown>) {
  const schema = buildZodSchema(questions);
  const result = schema.safeParse(values);

  if (result.success) {
    return {};
  }

  const errors = Object.fromEntries(
    Object.entries(result.error.flatten().fieldErrors).map(([key, value]) => [key, value?.[0] ?? "Invalid value"])
  );

  return errors;
}

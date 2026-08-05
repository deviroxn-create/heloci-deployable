import { z } from "zod";
import type { RenderedQuestion } from "./renderer";

export function createFieldSchema(question: RenderedQuestion) {
  const validation = (question.validation as Record<string, unknown> | undefined) ?? {};
  const minValue = typeof validation.min === "number" ? validation.min : undefined;
  const maxValue = typeof validation.max === "number" ? validation.max : undefined;
  const regexValue = typeof validation.regex === "string" ? validation.regex : undefined;
  const type = question.type?.toLowerCase() ?? "text";
  const key = question.key?.toLowerCase() ?? "";
  const isRequired = Boolean(question.required);
  const isMultiSelect = type === "multiselect" || type === "multi-select";
  const usesStringOptions = Boolean(question.options?.length) || /income/i.test(question.label ?? "") || /income/i.test(question.helpText ?? "");
  let schema: z.ZodTypeAny = isMultiSelect ? z.array(z.string()) : z.string();

  if (type === "number" && !usesStringOptions) {
    schema = z.coerce.number();
    if (typeof minValue === "number") {
      schema = schema.refine((value) => Number(value) >= minValue, `${question.label} must be at least ${minValue}`);
    }
    if (typeof maxValue === "number") {
      schema = schema.refine((value) => Number(value) <= maxValue, `${question.label} must be at most ${maxValue}`);
    }
  }

  if (isRequired) {
    if (type === "number" && !usesStringOptions) {
      schema = schema.refine((value) => value !== undefined && value !== null && value !== "", { message: `${question.label} is required.` });
    } else if (isMultiSelect) {
      schema = z.array(z.string()).min(1, `${question.label} is required.`);
    } else {
      schema = z.string().min(1, `${question.label} is required.`);
    }
  } else if (type === "number" && !usesStringOptions) {
    schema = z.coerce.number().optional();
  } else if (isMultiSelect) {
    schema = z.array(z.string()).optional();
  } else {
    schema = z.string().optional();
  }

  if (typeof regexValue === "string") {
    schema = schema.refine((value) => new RegExp(regexValue).test(String(value)), (validation.errorMessage as string) || `${question.label} is invalid.`);
  }

  if (key === "zipcode" || key === "zip") {
    const zipSchema = z.preprocess((value) => (value === undefined || value === null || value === "" ? "" : value), z.string().trim().min(1, "Enter a 5-digit ZIP code.").regex(/^\d{5}$/, "Enter a 5-digit ZIP code."));
    schema = question.required ? zipSchema : zipSchema.optional();
  }

  if (key === "state") {
    const stateSchema = z.preprocess((value) => (value === undefined || value === null || value === "" ? "" : value), z.string().trim().min(1, "Select your state").length(2, "Select your state"));
    schema = question.required ? stateSchema : stateSchema.optional();
  }

  if (key === "isveteran" || key === "hasdisability" || key === "issenior" || key === "isstudent" || key === "riskofeviction") {
    schema = question.required
      ? z.enum(["true", "false", "not_sure"])
      : z.enum(["true", "false", "not_sure"]).optional();
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

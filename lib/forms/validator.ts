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

/**
 * Validate application form data including custom validation rules
 */
export function validateApplicationForm(data: Record<string, unknown>): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  // SSN validation: must be exactly 9 digits
  if (data["personal.ssn"]) {
    const ssn = String(data["personal.ssn"]).replace(/\D/g, "");
    if (ssn.length !== 9) {
      errors["personal.ssn"] = "Enter a 9-digit Social Security Number";
    }
  }

  // SSN confirmation: must match
  if (data["personal.ssn"] && data["personal.ssnConfirm"]) {
    const ssn = String(data["personal.ssn"]).replace(/\D/g, "");
    const confirm = String(data["personal.ssnConfirm"]).replace(/\D/g, "");
    
    if (ssn !== confirm) {
      errors["personal.ssnConfirm"] = "SSNs do not match";
    }
  }

  // Phone validation: must be exactly 10 digits when provided
  const phoneFields = [
    { key: "personal.phone", required: true },
    { key: "personal.secondaryPhone", required: false },
    { key: "housing.landlordPhone", required: false },
  ];
  
  for (const field of phoneFields) {
    const value = data[field.key];
    
    if (value) {
      const phone = String(value).replace(/\D/g, "");
      if (phone.length !== 10) {
        errors[field.key] = "Enter a 10-digit US phone number";
      }
    } else if (field.required) {
      errors[field.key] = "Phone number is required";
    }
  }

  // Date of birth validation
  if (data["personal.dateOfBirth"]) {
    const dob = new Date(String(data["personal.dateOfBirth"]));
    const today = new Date();
    
    if (dob > today) {
      errors["personal.dateOfBirth"] = "Date of birth cannot be in the future";
    }
    
    const age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 15) {
      errors["personal.dateOfBirth"] = "You must be at least 15 years old";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

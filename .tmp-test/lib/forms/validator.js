"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildZodSchema = buildZodSchema;
exports.validatePage = validatePage;
const zod_1 = require("zod");
function createFieldSchema(question) {
    const validation = question.validation ?? {};
    const minValue = typeof validation.min === "number" ? validation.min : undefined;
    const maxValue = typeof validation.max === "number" ? validation.max : undefined;
    const regexValue = typeof validation.regex === "string" ? validation.regex : undefined;
    let schema = zod_1.z.string();
    if (question.type === "number") {
        schema = zod_1.z.coerce.number();
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
        }
        else {
            schema = zod_1.z.string().min(1, `${question.label} is required.`);
        }
    }
    if (typeof regexValue === "string") {
        schema = schema.refine((value) => new RegExp(regexValue).test(String(value)), validation.errorMessage || `${question.label} is invalid.`);
    }
    return schema;
}
function buildZodSchema(questions) {
    const shape = {};
    questions.forEach((question) => {
        shape[question.key] = createFieldSchema(question);
    });
    return zod_1.z.object(shape);
}
function validatePage(questions, data) {
    const schema = buildZodSchema(questions);
    const result = schema.safeParse(data);
    if (result.success) {
        return { valid: true, errors: {} };
    }
    const errors = Object.fromEntries(Object.entries(result.error.flatten().fieldErrors).map(([key, value]) => [key, value?.[0] ?? "Invalid value"]));
    return { valid: false, errors };
}

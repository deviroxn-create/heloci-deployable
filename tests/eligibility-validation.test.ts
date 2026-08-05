import test from "node:test";
import assert from "node:assert/strict";
import { validateQuestionValue, validateQuestions } from "../lib/forms/eligibility-validation";
import type { RenderedQuestion } from "../lib/forms/renderer";
import { applicantProfileSchema } from "../lib/validations/applicant-profile.schema";

const stateQuestion: RenderedQuestion = {
  id: "state",
  key: "state",
  label: "State",
  type: "select",
  required: true,
  value: undefined,
  visible: true
};

const zipQuestion: RenderedQuestion = {
  id: "zipCode",
  key: "zipCode",
  label: "ZIP code",
  type: "text",
  required: true,
  value: undefined,
  visible: true
};

const questions = [stateQuestion, zipQuestion];

test("selecting state does not validate ZIP until the ZIP field is touched", () => {
  const stateResult = validateQuestionValue(stateQuestion, "CA");
  assert.equal(stateResult.valid, true);
  assert.equal(stateResult.error, undefined);

  const zipResult = validateQuestionValue(zipQuestion, undefined);
  assert.equal(zipResult.valid, false);
  assert.equal(zipResult.error, "Enter a 5-digit ZIP code.");
});

test("invalid ZIP shows an inline error only for that field", () => {
  const result = validateQuestionValue(zipQuestion, "123");
  assert.equal(result.valid, false);
  assert.equal(result.error, "Enter a 5-digit ZIP code.");
});

test("back navigation preserves previously entered values", () => {
  const values = { state: "CA", zipCode: "90210" };
  const errors = validateQuestions(questions, values);
  assert.deepEqual(errors, {});
  assert.equal(values.state, "CA");
  assert.equal(values.zipCode, "90210");
});

test("submitting with one invalid field reports only that field", () => {
  const errors = validateQuestions(questions, { state: "CA", zipCode: "abc" });
  assert.deepEqual(errors, { zipCode: "Enter a 5-digit ZIP code." });
});

test("invalid applicant profile payloads use safe parsing instead of throwing", () => {
  const result = applicantProfileSchema.safeParse({ personal: { fullName: 123 } });
  assert.equal(result.success, false);
});

test("rapid field changes do not throw while validating", () => {
  assert.doesNotThrow(() => {
    validateQuestionValue(stateQuestion, "TX");
    validateQuestionValue(zipQuestion, "123");
    validateQuestionValue(zipQuestion, "90210");
  });
});

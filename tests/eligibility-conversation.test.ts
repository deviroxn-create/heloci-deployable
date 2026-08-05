import test from "node:test";
import assert from "node:assert/strict";
import { canContinueQuestion, shouldShowQuestion } from "../lib/eligibility/conditional";

const baseQuestion = {
  id: "q-veteran",
  key: "isVeteran",
  label: "Are you a veteran?",
  type: "radio",
  required: true,
  visible: true,
  value: undefined,
  condition: { key: "isVeteran", equals: "true" }
};

test("conditional questions respect simple answer-based rules", () => {
  assert.equal(shouldShowQuestion(baseQuestion as any, { isVeteran: "true" }), true);
  assert.equal(shouldShowQuestion(baseQuestion as any, { isVeteran: "false" }), false);
});

test("questions without conditions remain visible", () => {
  const question = { ...baseQuestion, condition: undefined } as any;
  assert.equal(shouldShowQuestion(question, {}), true);
});

test("optional questions can be continued without an answer", () => {
  const optionalQuestion = { ...baseQuestion, required: false } as any;
  const requiredQuestion = { ...baseQuestion, required: true } as any;

  assert.equal(canContinueQuestion(optionalQuestion, undefined), true);
  assert.equal(canContinueQuestion(requiredQuestion, undefined), false);
  assert.equal(canContinueQuestion(optionalQuestion, "under-10000"), true);
});

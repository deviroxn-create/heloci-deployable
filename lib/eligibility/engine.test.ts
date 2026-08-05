import test from "node:test";
import assert from "node:assert/strict";
import { evaluateEligibilityRule, resolveActiveRule } from "./engine";

test("qualifies a teacher for teacher housing when income and employment match", () => {
  const rule = {
    and: [
      { "==": [{ var: "employment.status" }, "teacher"] },
      { ">=": [{ var: "income.monthly" }, 3000] }
    ]
  };

  const profile = {
    employment: { status: "teacher" },
    income: { monthlyIncome: 3000, employmentStatus: "teacher" }
  };

  const result = evaluateEligibilityRule(rule, profile);

  assert.equal(result.isEligible, true);
  assert.ok(result.matched.some((item) => item.includes("Employment")));
});

test("rejects rent-to-own civil when the employment rule fails", () => {
  const rule = {
    and: [
      { "==": [{ var: "employment.status" }, "government_employee"] },
      { ">=": [{ var: "income.monthly" }, 2500] }
    ]
  };

  const profile = {
    employment: { status: "teacher" },
    income: { monthlyIncome: 3000, employmentStatus: "teacher" }
  };

  const result = evaluateEligibilityRule(rule, profile);

  assert.equal(result.isEligible, false);
  assert.ok(result.failed.some((item) => item.includes("Employment")));
});

test("sums score blocks for priority ranking", () => {
  const rule = {
    and: [
      { ">=": [{ var: "income.monthly" }, 2000] },
      { score: 20 },
      { score: 15 }
    ]
  };

  const profile = {
    income: { monthlyIncome: 2500 }
  };

  const result = evaluateEligibilityRule(rule, profile);

  assert.equal(result.isEligible, true);
  assert.equal(result.score, 35);
});

test("treats unknown responses as neutral rather than failing eligibility", () => {
  const rule = {
    "==": [{ var: "employment.status" }, "teacher"]
  };

  const profile = {
    employment: { status: "not_sure" }
  };

  const result = evaluateEligibilityRule(rule, profile);

  assert.equal(result.isEligible, true);
  assert.equal(result.needsReview, true);
  assert.equal(result.failed.length, 0);
});

test("uses the latest active version of a rule", () => {
  const versions = [
    { version: 1, isActive: false, rules: { "==": [{ var: "employment.status" }, "teacher"] } },
    { version: 2, isActive: true, rules: { "==": [{ var: "employment.status" }, "government_employee"] } }
  ];

  const active = resolveActiveRule(versions as Array<{ version: number; isActive: boolean; rules: unknown }>);
  assert.equal(active?.version, 2);
});

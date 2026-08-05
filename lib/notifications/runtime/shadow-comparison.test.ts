import test from "node:test";
import assert from "node:assert/strict";
import { compareShadowCommunications } from "./shadow-comparison.ts";

function communication(overrides: Record<string, unknown> = {}) {
  return {
    event: "application_submitted",
    audience: "applicant",
    recipient: "applicant@example.com",
    channel: "email",
    template: "applicant.application-submitted.email",
    ...overrides
  };
}

test("reports identical pipelines as a match", () => {
  const report = compareShadowCommunications("application_submitted", [communication()], [communication()]);

  assert.equal(report.hasDifferences, false);
  assert.equal(report.summary.matches, 1);
  assert.equal(report.summary.mismatches, 0);
  assert.equal(report.summary.missing, 0);
  assert.equal(report.summary.extra, 0);
  assert.equal(report.comparisons[0].kind, "match");
});

test("reports different audiences as a mismatch", () => {
  const report = compareShadowCommunications("application_submitted", [communication()], [communication({ audience: "reviewer" })]);

  assert.equal(report.hasDifferences, true);
  assert.equal(report.summary.matches, 0);
  assert.equal(report.summary.mismatches, 1);
  assert.deepEqual(report.comparisons[0].differences, ["audience"]);
});

test("reports different channels as a mismatch", () => {
  const report = compareShadowCommunications("application_submitted", [communication()], [communication({ channel: "telegram" })]);

  assert.equal(report.hasDifferences, true);
  assert.equal(report.summary.mismatches, 1);
  assert.deepEqual(report.comparisons[0].differences, ["channel"]);
});

test("reports different templates as a mismatch", () => {
  const report = compareShadowCommunications("application_submitted", [communication()], [communication({ template: "reviewer.application-submitted.email" })]);

  assert.equal(report.hasDifferences, true);
  assert.equal(report.summary.mismatches, 1);
  assert.deepEqual(report.comparisons[0].differences, ["template"]);
});

test("reports missing communications", () => {
  const report = compareShadowCommunications("application_submitted", [communication()], []);

  assert.equal(report.hasDifferences, true);
  assert.equal(report.summary.missing, 1);
  assert.equal(report.summary.extra, 0);
  assert.equal(report.comparisons[0].kind, "missing");
});

test("reports extra communications", () => {
  const report = compareShadowCommunications("application_submitted", [], [communication()]);

  assert.equal(report.hasDifferences, true);
  assert.equal(report.summary.missing, 0);
  assert.equal(report.summary.extra, 1);
  assert.equal(report.comparisons[0].kind, "extra");
});

import test from "node:test";
import assert from "node:assert/strict";
import { summarizeMatchResult } from "./results";

test("summarizes a completion payload with the right counts", () => {
  const summary = summarizeMatchResult({
    eligible: [
      { programId: "1", programName: "Alpha", programSlug: "alpha", programCategory: "rental", isEligible: true, score: 90, priority: 10, matched: ["Income"], failed: [], scoreBreakdown: [], needsReview: false },
      { programId: "2", programName: "Beta", programSlug: "beta", programCategory: "rental", isEligible: true, score: 82, priority: 8, matched: ["Employment"], failed: [], scoreBreakdown: [], needsReview: true }
    ],
    nearlyEligible: [
      { programId: "3", programName: "Gamma", programSlug: "gamma", programCategory: "rental", isEligible: false, score: 74, priority: 5, matched: ["Income"], failed: ["Income below threshold"], scoreBreakdown: [], needsReview: false }
    ],
    recommendedActions: [{ action: "Add income details", programs: ["Gamma"], missingFields: ["income.monthlyIncome"] }]
  });

  assert.equal(summary.totalMatches, 3);
  assert.equal(summary.eligibleCount, 2);
  assert.equal(summary.nearlyEligibleCount, 1);
  assert.equal(summary.recommendedActionCount, 1);
  assert.equal(summary.needsReviewCount, 1);
});

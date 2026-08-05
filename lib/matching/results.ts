import type { MatchResult, ProgramMatch } from "./engine";

export interface MatchSummary {
  totalMatches: number;
  eligibleCount: number;
  nearlyEligibleCount: number;
  recommendedActionCount: number;
  needsReviewCount: number;
  headline: string;
}

export function summarizeMatchResult(result: MatchResult): MatchSummary {
  const eligibleCount = result.eligible.length;
  const nearlyEligibleCount = result.nearlyEligible.length;
  const recommendedActionCount = result.recommendedActions.length;
  const needsReviewCount = result.eligible.filter((entry) => entry.needsReview).length + result.nearlyEligible.filter((entry) => entry.needsReview).length;

  const headline = eligibleCount > 0
    ? `You have ${eligibleCount} strong match${eligibleCount === 1 ? "" : "es"} ready to review.`
    : nearlyEligibleCount > 0
      ? `You have ${nearlyEligibleCount} near-match option${nearlyEligibleCount === 1 ? "" : "s"} to explore.`
      : "We found a few next steps to strengthen your match profile.";

  return {
    totalMatches: eligibleCount + nearlyEligibleCount,
    eligibleCount,
    nearlyEligibleCount,
    recommendedActionCount,
    needsReviewCount,
    headline
  };
}

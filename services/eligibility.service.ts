import { publishDomainEvent } from "../lib/events/domain-event-publisher";

export async function evaluateEligibility(income: number, householdSize: number, payload?: { name?: string; email?: string; userId?: string }) {
  const score = Math.max(0, Math.min(100, Math.round((income / householdSize) * 0.8)));
  publishDomainEvent("eligibility.assessed", {
    name: payload?.name || "Applicant",
    email: payload?.email,
    userId: payload?.userId,
    score,
    status: score >= 40 ? "Likely eligible" : "Review required",
  });

  return {
    score,
    status: score >= 40 ? "Likely eligible" : "Review required",
    recommendations: ["Verify income documentation", "Complete the application review checklist"]
  };
}

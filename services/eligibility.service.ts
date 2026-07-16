import { notificationService } from "@/lib/notifications/notification.service";

export async function evaluateEligibility(income: number, householdSize: number, payload?: { name?: string; email?: string; userId?: string }) {
  const score = Math.max(0, Math.min(100, Math.round((income / householdSize) * 0.8)));
  await notificationService.notify("eligibility_assessment_completed", {
    name: payload?.name || "Applicant",
    userEmail: payload?.email,
    recipientEmail: payload?.email,
    userId: payload?.userId,
    score,
    status: score >= 40 ? "Likely eligible" : "Review required"
  });

  return {
    score,
    status: score >= 40 ? "Likely eligible" : "Review required",
    recommendations: ["Verify income documentation", "Complete the application review checklist"]
  };
}

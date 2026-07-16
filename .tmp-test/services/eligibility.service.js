"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateEligibility = evaluateEligibility;
const notification_service_1 = require("@/lib/notifications/notification.service");
async function evaluateEligibility(income, householdSize, payload) {
    const score = Math.max(0, Math.min(100, Math.round((income / householdSize) * 0.8)));
    await notification_service_1.notificationService.notify("eligibility_assessment_completed", {
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

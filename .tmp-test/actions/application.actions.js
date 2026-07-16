"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitApplicationAction = submitApplicationAction;
const notification_service_1 = require("@/lib/notifications/notification.service");
async function submitApplicationAction(data) {
    await notification_service_1.notificationService.notify("application_submitted", {
        name: data?.applicantName || "Applicant",
        recipientEmail: data?.email,
        userEmail: data?.email,
        applicationId: data?.id
    });
    return { success: true, id: "application-stub" };
}

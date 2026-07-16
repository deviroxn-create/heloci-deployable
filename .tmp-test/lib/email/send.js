"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = sendWelcomeEmail;
exports.sendApplicationSubmittedEmail = sendApplicationSubmittedEmail;
const notification_service_1 = require("@/lib/notifications/notification.service");
async function sendWelcomeEmail(email, name) {
    return notification_service_1.notificationService.notify("user_registration", {
        name,
        recipientEmail: email,
        userEmail: email
    });
}
async function sendApplicationSubmittedEmail(email, name) {
    return notification_service_1.notificationService.notify("application_submitted", {
        name,
        recipientEmail: email,
        userEmail: email
    });
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerApplicationWorkflow = triggerApplicationWorkflow;
const notification_service_1 = require("@/lib/notifications/notification.service");
async function triggerApplicationWorkflow(email, name) {
    return notification_service_1.notificationService.notify("application_submitted", {
        name,
        recipientEmail: email,
        userEmail: email
    });
}

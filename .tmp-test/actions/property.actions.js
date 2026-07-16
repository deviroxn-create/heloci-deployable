"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPropertyAction = createPropertyAction;
const notification_service_1 = require("@/lib/notifications/notification.service");
async function createPropertyAction(data) {
    await notification_service_1.notificationService.notify("homeowner_listing_submitted", {
        name: data?.ownerName || "Homeowner",
        recipientEmail: data?.email,
        userEmail: data?.email
    });
    return { success: true, id: "property-stub" };
}

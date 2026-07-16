"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationSettingsAction = getNotificationSettingsAction;
exports.saveNotificationSettingsAction = saveNotificationSettingsAction;
exports.sendTestNotificationAction = sendTestNotificationAction;
exports.emitNotificationAction = emitNotificationAction;
exports.trackLoginNotificationAction = trackLoginNotificationAction;
exports.getCommunicationDashboardDataAction = getCommunicationDashboardDataAction;
exports.retryNotificationAction = retryNotificationAction;
exports.retryFailedNotificationsAction = retryFailedNotificationsAction;
exports.cancelPendingNotificationAction = cancelPendingNotificationAction;
exports.saveNotificationTemplateAction = saveNotificationTemplateAction;
exports.saveNotificationPreferenceAction = saveNotificationPreferenceAction;
const client_1 = require("@/lib/prisma/client");
const notification_service_1 = require("@/lib/notifications/notification.service");
async function getNotificationSettingsAction() {
    return (0, notification_service_1.getNotificationSettings)();
}
async function saveNotificationSettingsAction(settings) {
    return (0, notification_service_1.saveNotificationSettings)(settings);
}
async function sendTestNotificationAction(settings) {
    if (settings) {
        await (0, notification_service_1.saveNotificationSettings)(settings);
    }
    return notification_service_1.notificationService.notify("admin_test", {
        name: "Admin",
        userEmail: settings?.senderEmail || "support@heloci.ngo",
        recipientEmail: settings?.senderEmail || "support@heloci.ngo"
    });
}
async function emitNotificationAction(eventName, payload = {}) {
    return notification_service_1.notificationService.notify(eventName, payload);
}
async function trackLoginNotificationAction(email, name) {
    const user = await client_1.prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true }
    });
    return notification_service_1.notificationService.notify("user_login", {
        userId: user?.id,
        userEmail: email,
        recipientEmail: email,
        name: user?.name || name || email
    });
}
async function getCommunicationDashboardDataAction() {
    const [logs, templates, preferences, timeline] = await Promise.all([
        (0, notification_service_1.getNotificationLogs)(),
        (0, notification_service_1.getNotificationTemplates)(),
        (0, notification_service_1.getNotificationPreferences)(),
        (0, notification_service_1.getCommunicationTimeline)("")
    ]);
    const stats = {
        total: logs.length,
        today: logs.filter((log) => new Date(log.createdAt).toDateString() === new Date().toDateString()).length,
        failed: logs.filter((log) => log.deliveryStatus === "FAILED").length,
        pending: logs.filter((log) => ["PENDING", "QUEUED", "PROCESSING"].includes(log.deliveryStatus)).length,
        delivered: logs.filter((log) => ["SENT", "DELIVERED", "READ"].includes(log.deliveryStatus)).length,
        read: logs.filter((log) => log.deliveryStatus === "READ").length,
        email: logs.filter((log) => log.channel === "email").length,
        telegram: logs.filter((log) => log.channel === "telegram").length,
        whatsapp: logs.filter((log) => log.channel === "whatsapp").length,
        internal: logs.filter((log) => log.channel === "internal").length
    };
    return {
        stats,
        logs,
        templates,
        preferences,
        timeline
    };
}
async function retryNotificationAction(id) {
    return (0, notification_service_1.retryNotification)(id);
}
async function retryFailedNotificationsAction() {
    return (0, notification_service_1.retryFailedNotifications)();
}
async function cancelPendingNotificationAction(id) {
    return (0, notification_service_1.cancelPendingNotification)(id);
}
async function saveNotificationTemplateAction(input) {
    return (0, notification_service_1.saveNotificationTemplate)(input);
}
async function saveNotificationPreferenceAction(input) {
    return (0, notification_service_1.saveNotificationPreference)(input);
}

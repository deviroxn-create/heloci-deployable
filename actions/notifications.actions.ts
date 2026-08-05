"use server";

import {
  cancelPendingNotification,
  getCommunicationTimeline,
  getNotificationLogs,
  getNotificationPreferences,
  getNotificationSettings,
  getNotificationTemplates,
  retryFailedNotifications,
  retryNotification,
  saveNotificationPreference,
  saveNotificationSettings,
  saveNotificationTemplate,
  type NotificationEventName,
  type NotificationSettings
} from "@/lib/notifications/notification.service";
import { publishDomainEvent } from "@/lib/events/domain-event-publisher";
import { getUserNotificationProfile } from "@/lib/communications/message-template.service";

export async function getNotificationSettingsAction() {
  return getNotificationSettings();
}

export async function saveNotificationSettingsAction(settings: NotificationSettings) {
  return saveNotificationSettings(settings);
}

export async function sendTestNotificationAction(settings?: NotificationSettings) {
  if (settings) {
    await saveNotificationSettings(settings);
  }

  publishDomainEvent("admin.action", {
    name: "Admin",
    userEmail: settings?.senderEmail || "support@heloci.ngo",
    recipientEmail: settings?.senderEmail || "support@heloci.ngo"
  });

  return { success: true };
}

export async function emitNotificationAction(eventName: NotificationEventName, payload: Record<string, unknown> = {}) {
  publishDomainEvent(eventName.replace(/_/g, "."), payload as any);
  return { success: true };
}

export async function trackLoginNotificationAction(email: string, name?: string) {
  const user = await getUserNotificationProfile(email);

  publishDomainEvent("user.login", {
    userId: user?.id,
    userEmail: email,
    recipientEmail: email,
    name: user?.name || name || email
  });

  return { success: true };
}

export async function getCommunicationDashboardDataAction() {
  const [logs, templates, preferences, timeline] = await Promise.all([
    getNotificationLogs(),
    getNotificationTemplates(),
    getNotificationPreferences(),
    getCommunicationTimeline("")
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

export async function retryNotificationAction(id: string) {
  return retryNotification(id);
}

export async function retryFailedNotificationsAction() {
  return retryFailedNotifications();
}

export async function cancelPendingNotificationAction(id: string) {
  return cancelPendingNotification(id);
}

export async function saveNotificationTemplateAction(input: Parameters<typeof saveNotificationTemplate>[0]) {
  return saveNotificationTemplate(input);
}

export async function saveNotificationPreferenceAction(input: Parameters<typeof saveNotificationPreference>[0]) {
  return saveNotificationPreference(input);
}

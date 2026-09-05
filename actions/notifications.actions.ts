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
import { getCurrentUser } from "@/lib/auth/session";
import { requireOrgRole } from "@/lib/auth/rbac";

async function requireNotificationOperator() {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  if (user.role === "SUPER_ADMIN") {
    return user;
  }

  if (!user.organizationId || !["ADMIN", "STAFF"].includes(user.role)) {
    throw new Error("Unauthorized");
  }

  await requireOrgRole(user.id, user.organizationId, [
    "org_admin",
    "manager",
    "reviewer",
    "case_worker",
    "document_officer",
  ]);

  return user;
}

export async function getNotificationSettingsAction() {
  await requireNotificationOperator();
  return getNotificationSettings();
}

export async function saveNotificationSettingsAction(settings: NotificationSettings) {
  await requireNotificationOperator();
  return saveNotificationSettings(settings);
}

export async function sendTestNotificationAction(settings?: NotificationSettings) {
  const user = await requireNotificationOperator();
  if (settings) {
    await saveNotificationSettings(settings);
  }

  publishDomainEvent("admin.action", {
    name: user.name || user.email,
    userEmail: settings?.senderEmail || "support@heloci.ngo",
    recipientEmail: settings?.senderEmail || "support@heloci.ngo"
  });

  return { success: true };
}

export async function emitNotificationAction(eventName: NotificationEventName, payload: Record<string, unknown> = {}) {
  await requireNotificationOperator();
  publishDomainEvent(eventName.replace(/_/g, "."), payload as any);
  return { success: true };
}

export async function trackLoginNotificationAction(email: string, name?: string) {
  const authenticatedUser = await getCurrentUser();
  if (!authenticatedUser?.id || authenticatedUser.email !== email) {
    throw new Error("Unauthorized");
  }

  const user = await getUserNotificationProfile(authenticatedUser.email);

  publishDomainEvent("user.login", {
    userId: user?.id,
    userEmail: authenticatedUser.email,
    recipientEmail: authenticatedUser.email,
    name: user?.name || authenticatedUser.name || name || authenticatedUser.email
  });

  return { success: true };
}

export async function getCommunicationDashboardDataAction() {
  await requireNotificationOperator();
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
  await requireNotificationOperator();
  return retryNotification(id);
}

export async function retryFailedNotificationsAction() {
  await requireNotificationOperator();
  return retryFailedNotifications();
}

export async function cancelPendingNotificationAction(id: string) {
  await requireNotificationOperator();
  return cancelPendingNotification(id);
}

export async function saveNotificationTemplateAction(input: Parameters<typeof saveNotificationTemplate>[0]) {
  await requireNotificationOperator();
  return saveNotificationTemplate(input);
}

export async function saveNotificationPreferenceAction(input: Parameters<typeof saveNotificationPreference>[0]) {
  await requireNotificationOperator();
  return saveNotificationPreference(input);
}

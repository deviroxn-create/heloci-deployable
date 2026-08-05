"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { resolveCommunicationScope, canAccessOrganization, getScopeFilter, getOperationOrganizationId } from "@/lib/communications/scope.service";
import { authorizeCommunicationRead } from "@/lib/auth/communication-authorization";
import type { NotificationDeliveryStatus } from "@/lib/notifications/communication-types";
import {
  getNotificationLogById,
  getNotificationOwnerOrgId,
  getApplicationDeliveryData,
  getNotificationDeliveryMetrics,
  getFailedNotificationsForOrg,
  createRetryAttempt,
  getNotificationDeliveryHistory,
  countNotificationDeliveryHistory,
  updateNotificationDeliveryStatus,
  retryNotificationDelivery,
  getNotificationDeliveryRecords,
  getApplicationDeliveryRecord,
  getNotificationDeliveryRecord,
  updateNotificationDeliveryRecord
} from "@/lib/communications/delivery-tracking.service";

/**
 * DELIVERY TRACKING SYSTEM - Server Actions
 * Phase 1.7 Milestone 6
 * 
 * Reuses existing NotificationLog infrastructure
 * Exposes delivery tracking for all communication types
 */

export interface DeliveryStatus {
  id: string;
  eventName: string;
  channel: string;
  recipient?: string;
  subject?: string;
  status: NotificationDeliveryStatus;
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
}

export interface DeliveryMetrics {
  total: number;
  pending: number;
  queued: number;
  sending: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  cancelled: number;
  successRate: number;
  failureRate: number;
  retryingCount: number;
}

export interface RetryAttempt {
  id: string;
  attempt: number;
  status: NotificationDeliveryStatus;
  errorMessage?: string;
  createdAt: Date;
}

/**
 * Get delivery status for a specific notification
 * Platform Admins can view any notification; Org members see their own
 */
export async function getDeliveryStatusAction(notificationId: string, selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const notification = await getNotificationLogById(notificationId);

  if (!notification) throw new Error("Notification not found");

  // Determine organization context for this notification
  let notificationOrgId: string | null = null;
  if (notification.userId) {
    notificationOrgId = await getNotificationOwnerOrgId(notification.userId);
  }

  const scope = resolveCommunicationScope(user, selectedOrgId);
  if (notificationOrgId && !canAccessOrganization(scope, notificationOrgId)) {
    throw new Error("UNAUTHORIZED");
  }

  return {
    id: notification.id,
    eventName: notification.eventName,
    channel: notification.channel,
    recipient: notification.recipient || undefined,
    subject: notification.subject || undefined,
    status: notification.deliveryStatus as NotificationDeliveryStatus,
    createdAt: notification.createdAt,
    sentAt: notification.sentAt || undefined,
    deliveredAt: notification.deliveredAt || undefined,
    readAt: notification.readAt || undefined,
    errorMessage: notification.errorMessage || undefined,
    retryCount: notification.retryCount,
    maxRetries: notification.maxRetries,
    nextRetryAt: notification.nextRetryAt || undefined,
    retryAttempts: notification.retryAttempts
  };
}

/**
 * Get delivery history for an application
 * Platform Admins can view any app after organization selection
 */
export async function getApplicationDeliveryHistoryAction(
  applicationId: string,
  page: number = 1,
  pageSize: number = 50,
  selectedOrgId?: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  // Verify access to application
  const application = await getApplicationDeliveryRecord(applicationId);

  if (!application) throw new Error("Application not found");

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const operationOrganizationId = getOperationOrganizationId(scope);
  if (operationOrganizationId && application.program.organizationId !== operationOrganizationId) {
    throw new Error("UNAUTHORIZED");
  }

  const skip = (page - 1) * pageSize;

  // Get all communications (emails + internal messages) with delivery status
  const { notifications, caseMessages, total } = await getApplicationDeliveryData(applicationId, page, pageSize);

  // Merge and sort by date
  const merged = [
    ...notifications.map(n => ({
      id: n.id,
      type: "email" as const,
      channel: n.channel,
      recipient: n.recipient,
      sender: n.sender,
      senderIdentity: n.senderIdentity ? {
        id: n.senderIdentity.id,
        displayName: n.senderIdentity.displayName,
        emailAddress: n.senderIdentity.emailAddress,
        department: n.senderIdentity.department
      } : undefined,
      subject: n.subject,
      status: n.deliveryStatus,
      createdAt: n.createdAt,
      sentAt: n.sentAt,
      deliveredAt: n.deliveredAt,
      readAt: n.readAt,
      errorMessage: n.errorMessage,
      retryCount: n.retryCount,
      maxRetries: n.maxRetries
    })),
    ...caseMessages.map(m => ({
      id: m.id,
      type: "internal_message" as const,
      channel: "internal",
      recipient: undefined,
      subject: m.senderRole,
      status: m.read ? ("READ" as const) : ("SENT" as const),
      createdAt: m.createdAt,
      sentAt: m.createdAt,
      deliveredAt: m.createdAt,  // Internal messages delivered immediately
      readAt: m.readAt,
      errorMessage: undefined,
      senderName: m.sender.name,
      preview: m.content.substring(0, 100),
      retryCount: 0,
      maxRetries: 0
    }))
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return {
    communications: merged,
    total,
    page,
    pageSize
  };
}

/**
 * Get delivery metrics for organization or platform
 * Platform Admins see global or filtered metrics; Org members see their own
 */
export async function getDeliveryMetricsAction(selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const operationOrganizationId = getOperationOrganizationId(scope);

  if (operationOrganizationId) {
    await authorizeCommunicationRead(operationOrganizationId, [
      "org_admin",
      "manager",
      "case_worker"
    ]);
  }

  const organizationFilter = getScopeFilter(scope, "user.organizationId");

  const statuses = await getNotificationDeliveryMetrics(organizationFilter);

  const pending = statuses.pending;
  const queued = statuses.queued;
  const sent = statuses.sent;
  const delivered = statuses.delivered;
  const read = statuses.read;
  const failed = statuses.failed;
  const cancelled = statuses.cancelled;
  const sending = queued;  // In-flight
  const retrying = statuses.retrying;
  const total = statuses.total;

  const successCount = delivered + read;
  const successRate = total > 0 ? (successCount / total) * 100 : 0;
  const failureRate = total > 0 ? (failed / total) * 100 : 0;

  return {
    total,
    pending,
    queued,
    sending,
    sent,
    delivered,
    read,
    failed,
    cancelled,
    successRate: Math.round(successRate * 100) / 100,
    failureRate: Math.round(failureRate * 100) / 100,
    retryingCount: retrying
  };
}

/**
 * Get failed notifications requiring attention
 */
export async function getFailedNotificationsAction(
  limit: number = 25,
  selectedOrgId?: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const operationOrganizationId = getOperationOrganizationId(scope);

  if (operationOrganizationId) {
    await authorizeCommunicationRead(operationOrganizationId, [
      "org_admin",
      "manager",
      "case_worker"
    ]);
  }

  const organizationFilter = getScopeFilter(scope, "user.organizationId");

  const failed = await getFailedNotificationsForOrg(organizationFilter, limit);

  return failed.map(f => ({
    id: f.id,
    eventName: f.eventName,
    channel: f.channel,
    recipient: f.recipient,
    subject: f.subject,
    error: f.errorMessage,
    createdAt: f.createdAt,
    sentAt: f.sentAt,
    retryCount: f.retryCount,
    maxRetries: f.maxRetries,
    canRetry: f.retryCount < f.maxRetries,
    nextRetryAt: f.nextRetryAt
  }));
}

/**
 * Retry a failed notification
 */
export async function retryNotificationAction(notificationId: string, selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const notification = await getNotificationDeliveryRecord(notificationId);

  if (!notification) throw new Error("Notification not found");

  const scope = resolveCommunicationScope(user, selectedOrgId);

  // Verify organization access
  if (notification.userId) {
    const ownerOrgId = await getNotificationOwnerOrgId(notification.userId);

    if (ownerOrgId && !canAccessOrganization(scope, ownerOrgId)) {
      throw new Error("UNAUTHORIZED");
    }
  }

  // Check if already at max retries
  if (notification.retryCount >= notification.maxRetries) {
    throw new Error("Maximum retries exceeded");
  }

  // Store current attempt before retry
  await createRetryAttempt(notificationId, notification.deliveryStatus, notification.errorMessage);

  // Reset to QUEUED for retry
  const updated = await retryNotificationDelivery(notificationId);

  return {
    id: updated.id,
    status: updated.deliveryStatus,
    retryCount: updated.retryCount,
    maxRetries: updated.maxRetries
  };
}

/**
 * Retry all failed notifications for an organization
 */
export async function retryAllFailedNotificationsAction(selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const operationOrganizationId = getOperationOrganizationId(scope);

  if (operationOrganizationId) {
    await authorizeCommunicationRead(operationOrganizationId, ["org_admin"]);
  }

  const organizationFilter = getScopeFilter(scope, "user.organizationId");

  const failed = await getNotificationDeliveryRecords(organizationFilter);

  let retried = 0;
  for (const notification of failed) {
    await updateNotificationDeliveryStatus(notification.id);
    retried++;
  }

  return {
    retriedCount: retried,
    totalFailed: failed.length
  };
}

/**
 * Get retry attempts for a notification
 */
export async function getRetryAttemptsAction(
  notificationId: string,
  selectedOrgId?: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const notification = await getNotificationLogById(notificationId);

  if (!notification) throw new Error("Notification not found");

  const scope = resolveCommunicationScope(user, selectedOrgId);

  if (notification.userId) {
    const ownerOrgId = await getNotificationOwnerOrgId(notification.userId);

    if (ownerOrgId && !canAccessOrganization(scope, ownerOrgId)) {
      throw new Error("UNAUTHORIZED");
    }
  }

  return notification.retryAttempts.map(attempt => ({
    id: attempt.id,
    attempt: attempt.attempt,
    status: attempt.status,
    errorMessage: attempt.errorMessage || undefined,
    createdAt: attempt.createdAt
  }));
}

/**
 * Cancel a notification
 */
export async function cancelNotificationAction(notificationId: string, selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const notification = await getNotificationDeliveryRecord(notificationId);

  if (!notification) throw new Error("Notification not found");

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const operationOrganizationId = getOperationOrganizationId(scope);

  if (operationOrganizationId) {
    await authorizeCommunicationRead(operationOrganizationId, ["org_admin", "case_worker"]);
  }

  if (notification.userId) {
    const ownerOrgId = await getNotificationOwnerOrgId(notification.userId);

    if (ownerOrgId && !canAccessOrganization(scope, ownerOrgId)) {
      throw new Error("UNAUTHORIZED");
    }
  }

  // Can only cancel pending/queued notifications
  if (!["PENDING", "QUEUED"].includes(notification.deliveryStatus)) {
    throw new Error("Can only cancel pending or queued notifications");
  }

  return updateNotificationDeliveryRecord(notificationId);
}

/**
 * Search delivery history with filters
 */
export async function searchDeliveryHistoryAction(
  filters: {
    status?: NotificationDeliveryStatus;
    channel?: string;
    recipient?: string;
    startDate?: Date;
    endDate?: Date;
    hasErrors?: boolean;
  },
  page: number = 1,
  pageSize: number = 50,
  selectedOrgId?: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);

  const skip = (page - 1) * pageSize;
  
  const organizationFilter = getScopeFilter(scope, "user.organizationId");

  const where: any = {
    user: organizationFilter
  };

  if (filters.status) where.deliveryStatus = filters.status;
  if (filters.channel) where.channel = filters.channel;
  if (filters.recipient) {
    where.recipient = { contains: filters.recipient, mode: "insensitive" };
  }
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }
  if (filters.hasErrors === true) {
    where.errorMessage = { not: null };
  }

  const [results, total] = await Promise.all([
    getNotificationDeliveryHistory(organizationFilter, filters, skip, pageSize),
    countNotificationDeliveryHistory(organizationFilter, filters)
  ]);

  return {
    results,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

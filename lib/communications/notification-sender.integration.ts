/**
 * NOTIFICATION SENDER INTEGRATION
 * Integrates SenderIdentity into the NotificationService pipeline
 * 
 * This module provides helpers to resolve and use sender identities
 * within the existing notification infrastructure
 */

import { prisma } from '@/lib/prisma/client';
import { SenderIdentity } from '@prisma/client';
import { resolveSender } from './sender-identity.service';
import { CommunicationScope } from './scope.service';

export interface NotificationSenderContext {
  organizationId?: string;
  eventName: string;
  templateId?: string;
  overrideSenderId?: string;
  recipient: string;
}

/**
 * Resolve sender for a notification
 * Priority: override > template > org default > first active
 */
export async function resolveSenderForNotification(
  context: NotificationSenderContext
): Promise<SenderIdentity | null> {
  if (!context.organizationId) {
    return null;
  }

  // Priority 1: Override sender
  if (context.overrideSenderId) {
    const sender = await prisma.senderIdentity.findFirst({
      where: {
        id: context.overrideSenderId,
        organizationId: context.organizationId,
        isActive: true,
      },
    });
    if (sender) return sender;
  }

  // Priority 2: Template-specified sender
  if (context.templateId) {
    const template = await prisma.notificationTemplate.findUnique({
      where: { id: context.templateId },
      include: { senderIdentity: true },
    });
    if (template?.senderIdentity && template.senderIdentity.isActive) {
      return template.senderIdentity;
    }
  }

  // Priority 3: Event-based sender mapping
  // Implement custom logic based on eventName if needed
  // Example: if (context.eventName === 'DECISION_LETTER') return housingDeptSender;

  // Priority 4: Organization default or first active
  // Create a scope for the notification context
  // Note: In notification context, we don't have a specific userId, so we use a system placeholder
  const scope: CommunicationScope = {
    mode: "organization" as const,
    organizationId: context.organizationId,
    userId: "system-notification", // Placeholder for system-generated notifications
    isPlatform: false,
    canViewAllOrganizations: false,
    canSendAsAnyOrganization: false,
    selectedOrganizationId: null,
  };
  return resolveSender(scope);
}

/**
 * Format sender for email headers
 */
export function formatSenderForEmail(sender: SenderIdentity): { from: string; replyTo?: string } {
  return {
    from: `${sender.displayName} <${sender.emailAddress}>`,
    replyTo: sender.replyTo || sender.emailAddress,
  };
}

/**
 * Log sender identity usage
 */
export async function logSenderUsage(
  notificationLogId: string,
  senderId: string
): Promise<void> {
  await prisma.notificationLog.update({
    where: { id: notificationLogId },
    data: { senderIdentityId: senderId },
  });
}

/**
 * Get sender info for notification tracking
 */
export async function getSenderForTracking(
  notificationLogId: string
): Promise<SenderIdentity | null> {
  const log = await prisma.notificationLog.findUnique({
    where: { id: notificationLogId },
    include: { senderIdentity: true },
  });
  return log?.senderIdentity || null;
}

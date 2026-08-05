/**
 * EMAIL COMPOSE SERVER ACTIONS
 * Handles email composition and sending with support for internal and external recipients
 * 
 * Integrates with:
 * - RecipientPickerInline (UI component)
 * - NotificationService (actual email sending)
 * - SenderIdentity (from sender)
 * - Mixed recipients (internal users + external emails)
 */

'use server';

import { getCurrentUser } from '@/lib/auth/session';
import { authorizeSenderIdentityAccess } from '@/lib/auth/communication-authorization';
import type { RecipientCard } from '@/lib/communications/recipient.types';
import { getSenderIdentityForCompose } from '@/lib/communications/email-compose.service';
import { publishDomainEvent } from '@/lib/events/domain-event-publisher';

/**
 * Recipient for sending (combines internal and external)
 */
export interface ComposableRecipient {
  email: string;
  name?: string;
  userId?: string | null;
  isExternal?: boolean;
}

/**
 * Email composition payload
 */
export interface EmailComposePayload {
  organizationId: string;
  senderId: string;
  subject: string;
  htmlBody: string;
  plainTextBody?: string;
  recipients: ComposableRecipient[];
  replyTo?: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    mimeType?: string;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Response from email send
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  recipients: Array<{
    email: string;
    status: 'sent' | 'failed' | 'invalid';
    reason?: string;
  }>;
  failureCount: number;
  successCount: number;
}

/**
 * Validate recipients format
 */
export async function validateEmailRecipientsAction(
  recipients: ComposableRecipient[]
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (recipients.length === 0) {
    errors.push('At least one recipient is required');
  }

  for (const recipient of recipients) {
    if (!emailRegex.test(recipient.email)) {
      errors.push(`Invalid email address: ${recipient.email}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Send email to mixed recipients (internal + external)
 * 
 * Converts recipients to NotificationService format:
 * - Internal users: userId + email + name
 * - External addresses: email only, no userId
 */
export async function sendMixedEmailAction(
  payload: EmailComposePayload
): Promise<EmailSendResult> {
  const user = await getCurrentUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  // Verify sender identity access
  await authorizeSenderIdentityAccess(payload.organizationId);

  // Validate recipients
  const validation = await validateEmailRecipientsAction(payload.recipients);
  if (!validation.valid) {
    throw new Error(`Invalid recipients: ${validation.errors.join(', ')}`);
  }

  // Get sender identity details
  const sender = await getSenderIdentityForCompose(payload.senderId, payload.organizationId);

  if (!sender) {
    throw new Error('Sender identity not found');
  }

  const results: EmailSendResult['recipients'] = [];
  let successCount = 0;
  let failureCount = 0;

  /**
   * Send email to each recipient
   * For internal users: pass userId so NotificationService can track engagement
   * For external: pass email only, userId = null
   * 
   * PHASE B.6 CANONICALIZATION FIX:
   * This code was previously calling notify() with 'custom_email' event,
   * which is an undocumented event not in the Communication Registry.
   * 
   * Now it publishes the domain event instead, allowing the notification system
   * to follow the proper flow through the canonical pipeline.
   */
  for (const recipient of payload.recipients) {
    try {
      publishDomainEvent(
        'admin.action', // Maps to 'admin_action' communication event via registry
        {
          userId: recipient.userId || undefined, // Only for internal users
          userEmail: recipient.email,
          recipientEmail: recipient.email,
          name: recipient.name || recipient.email,
          subject: payload.subject,
          htmlBody: payload.htmlBody,
          plainTextBody: payload.plainTextBody,
          senderIdentity: sender.displayName,
          organizationId: payload.organizationId,
          // Custom metadata to identify this as a compose send
          isComposedEmail: true,
          isExternalRecipient: recipient.isExternal || false,
          attachments: payload.attachments,
          metadata: payload.metadata,
          senderIdentityId: payload.senderId
        }
      );

      // Domain event was published - notify system will handle it
      results.push({
        email: recipient.email,
        status: 'sent',
      });
      successCount++;
    } catch (error) {
      results.push({
        email: recipient.email,
        status: 'failed',
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
      failureCount++;
    }
  }

  return {
    success: failureCount === 0,
    recipients: results,
    successCount,
    failureCount,
  };
}

/**
 * Convert RecipientCard to ComposableRecipient
 * Handles both internal users (with userId) and external emails (without userId)
 */
export function recipientCardToComposable(card: RecipientCard): ComposableRecipient {
  return {
    email: card.email,
    name: card.name !== card.email ? card.name : undefined,
    userId: card.userId || null,
    isExternal: card.isExternal || false,
  };
}

/**
 * Batch convert RecipientCards to ComposableRecipients
 */
export function recipientCardsToComposable(cards: RecipientCard[]): ComposableRecipient[] {
  return cards.map(recipientCardToComposable);
}

/**
 * Get recipient statistics for display
 */
export function getRecipientStats(recipients: ComposableRecipient[]) {
  const internalCount = recipients.filter((r) => !r.isExternal && r.userId).length;
  const externalCount = recipients.filter((r) => r.isExternal || !r.userId).length;

  return {
    total: recipients.length,
    internal: internalCount,
    external: externalCount,
    hasInternal: internalCount > 0,
    hasExternal: externalCount > 0,
  };
}

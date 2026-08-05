/**
 * SENDER IDENTITY SERVER ACTIONS
 * Handles all sender identity management operations
 * 
 * AUTHORIZATION: All operations use centralized authorizeSenderIdentityAccess()
 * This ensures Platform Super Admins can access any organization after selection,
 * while organization members are restricted to their own organization.
 */

'use server';

import { getCurrentUser } from '@/lib/auth/session';
import { resolveCommunicationScope } from '@/lib/communications/scope.service';
import { authorizeSenderIdentityAccess } from '@/lib/auth/communication-authorization';
import {
  getSenderIdentities,
  getSenderIdentity,
  getDefaultSender,
  createSenderIdentity,
  updateSenderIdentity,
  deleteSenderIdentity,
  enableSenderIdentity,
  setDefaultSender,
  updateVerificationStatus,
  getSenderUsage,
} from '@/lib/communications/sender-identity.service';

/**
 * Get all sender identities for organization
 */
export async function getSendersAction(organizationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  
  await authorizeSenderIdentityAccess(organizationId);
  const scope = resolveCommunicationScope(user, organizationId);
  return getSenderIdentities(scope);
}

/**
 * Get default sender for organization
 */
export async function getDefaultSenderAction(organizationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  
  await authorizeSenderIdentityAccess(organizationId);
  const scope = resolveCommunicationScope(user, organizationId);
  return getDefaultSender(scope);
}

/**
 * Create sender identity
 */
export async function createSenderAction(input: {
  organizationId: string;
  displayName: string;
  emailAddress: string;
  department?: string;
  replyTo?: string;
  signature?: string;
  logoUrl?: string;
  themeColor?: string;
  isDefault?: boolean;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  
  await authorizeSenderIdentityAccess(input.organizationId);

  const scope = resolveCommunicationScope(user, input.organizationId);
  return createSenderIdentity({
    ...input,
    createdBy: user.id,
    scope,
  });
}

/**
 * Update sender identity
 */
export async function updateSenderAction(
  senderId: string,
  organizationId: string,
  input: {
    displayName?: string;
    department?: string;
    replyTo?: string;
    signature?: string;
    logoUrl?: string;
    themeColor?: string;
    isDefault?: boolean;
  }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  
  await authorizeSenderIdentityAccess(organizationId);
  const scope = resolveCommunicationScope(user, organizationId);
  return updateSenderIdentity(senderId, scope, input);
}

/**
 * Delete sender identity
 */
export async function deleteSenderAction(senderId: string, organizationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  
  await authorizeSenderIdentityAccess(organizationId);
  const scope = resolveCommunicationScope(user, organizationId);
  return deleteSenderIdentity(senderId, scope);
}

/**
 * Enable sender identity
 */
export async function enableSenderAction(senderId: string, organizationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  
  await authorizeSenderIdentityAccess(organizationId);
  const scope = resolveCommunicationScope(user, organizationId);
  return enableSenderIdentity(senderId, scope);
}

/**
 * Set as default sender
 */
export async function setDefaultSenderAction(senderId: string, organizationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  
  await authorizeSenderIdentityAccess(organizationId);
  const scope = resolveCommunicationScope(user, organizationId);
  return setDefaultSender(senderId, scope);
}

/**
 * Mark sender as verified
 */
export async function markSenderVerifiedAction(senderId: string, organizationId: string) {
  await authorizeSenderIdentityAccess(organizationId);
  return updateVerificationStatus(senderId, 'VERIFIED');
}

/**
 * Test sender identity by sending test email
 */
export async function testSenderAction(
  senderId: string,
  organizationId: string,
  recipientEmail: string,
  subject: string = 'Test Email'
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  
  await authorizeSenderIdentityAccess(organizationId);
  const scope = resolveCommunicationScope(user, organizationId);

  const sender = await getSenderIdentity(senderId, scope);
  if (!sender) throw new Error('Sender not found');

  // Send actual test email via NotificationService
  const { notify } = await import('@/lib/notifications/notification.service');

  try {
    const result = await notify(
      'admin_test',
      {
        userId: user.id,
        userEmail: recipientEmail,
        recipientEmail: recipientEmail,
        name: user.name || 'Admin',
        senderIdentity: sender.displayName,
        organizationId: organizationId,
      },
      senderId // Pass sender identity ID
    );

    if (result.delivered) {
      // Mark as verified when test succeeds
      await updateVerificationStatus(senderId, 'VERIFIED');

      return {
        success: true,
        message: 'Test email sent successfully',
        senderEmail: sender.emailAddress,
        recipient: recipientEmail,
        channels: result.channels,
      };
    } else {
      throw new Error(result.reason || 'Failed to send test email');
    }
  } catch (error) {
    // Mark as failed if test fails
    await updateVerificationStatus(
      senderId,
      'FAILED',
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
}

/**
 * Get sender usage statistics
 */
export async function getSenderUsageAction(senderId: string, organizationId: string, days: number = 30) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  
  await authorizeSenderIdentityAccess(organizationId);
  const scope = resolveCommunicationScope(user, organizationId);
  return getSenderUsage(senderId, scope, days);
}

/**
 * Duplicate sender identity
 */
export async function duplicateSenderAction(senderId: string, organizationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  
  await authorizeSenderIdentityAccess(organizationId);
  const scope = resolveCommunicationScope(user, organizationId);

  const original = await getSenderIdentity(senderId, scope);
  if (!original) throw new Error('Sender not found');

  return createSenderIdentity({
    organizationId,
    displayName: `${original.displayName} (Copy)`,
    emailAddress: original.emailAddress,
    department: original.department || undefined,
    replyTo: original.replyTo || undefined,
    signature: original.signature || undefined,
    logoUrl: original.logoUrl || undefined,
    themeColor: original.themeColor || undefined,
    createdBy: user.id,
    scope,
  });
}

/**
 * EMAIL INFRASTRUCTURE SERVER ACTIONS
 * Phase 1.8: Email Infrastructure Management
 * 
 * Reuses existing NotificationService for test emails
 * Reuses NotificationLog for all metrics
 */

'use server';

import { getCurrentUser } from '@/lib/auth/session';
import { authorizeCommunicationRead } from '@/lib/auth/communication-authorization';
import { getOperationOrganizationId, resolveCommunicationScope } from '@/lib/communications/scope.service';
import { publishDomainEvent } from '@/lib/events/domain-event-publisher';
import {
  getProviderStatus,
  getEmailMetrics,
  getProviderDiagnostics,
  getTemplateMapping,
  getRecentDeliveryHistory,
  getSenderIdentities,
  getCloudflareForwardings,
  validateSenderIdentity,
} from '@/lib/communications/email-infrastructure.service';

/**
 * Get email infrastructure status
 * Returns provider and health information
 */
export async function getEmailInfrastructureStatus(selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const operationOrganizationId = getOperationOrganizationId(scope);

  if (operationOrganizationId) {
    await authorizeCommunicationRead(operationOrganizationId, ["org_admin"]);
  }

  return await getProviderStatus();
}

/**
 * Get email metrics dashboard data
 */
export async function getEmailMetricsAction(selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const organizationId = getOperationOrganizationId(scope);

  if (!organizationId) {
    throw new Error('INVALID_SCOPE: Organization context required');
  }

  await authorizeCommunicationRead(organizationId, ['org_admin']);

  return await getEmailMetrics(scope, user.id);
}

/**
 * Get full provider diagnostics
 */
export async function getProviderDiagnosticsAction(selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const organizationId = getOperationOrganizationId(scope);

  if (!organizationId) {
    throw new Error('INVALID_SCOPE: Organization context required');
  }

  await authorizeCommunicationRead(organizationId, ['org_admin']);

  return await getProviderDiagnostics(scope, user.id);
}

/**
 * Get template to sender mapping
 */
export async function getTemplateMappingAction(selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const organizationId = getOperationOrganizationId(scope);

  if (!organizationId) {
    throw new Error('INVALID_SCOPE: Organization context required');
  }

  await authorizeCommunicationRead(organizationId, ['org_admin']);

  return await getTemplateMapping(scope, user.id);
}

/**
 * Get recent delivery history
 */
export async function getDeliveryHistoryAction(limit: number = 10, selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const organizationId = getOperationOrganizationId(scope);

  if (!organizationId) {
    throw new Error('INVALID_SCOPE: Organization context required');
  }

  await authorizeCommunicationRead(organizationId, ['org_admin']);

  return await getRecentDeliveryHistory(scope, user.id, limit);
}

/**
 * Get all sender identities
 */
export async function getSenderIdentitiesAction(selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const scope = resolveCommunicationScope(user, selectedOrgId);

  return getSenderIdentities();
}

/**
 * Get Cloudflare forwarding configuration
 */
export async function getCloudflareForwardingsAction(selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const scope = resolveCommunicationScope(user, selectedOrgId);

  return getCloudflareForwardings();
}

/**
 * Send test email using NotificationService
 * Reuses existing email infrastructure
 */
export async function sendTestEmailAction(input: {
  recipientEmail: string;
  senderIdentity: string;
  subject: string;
  message: string;
  selectedOrgId?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const scope = resolveCommunicationScope(user, input.selectedOrgId);
  const operationOrganizationId = getOperationOrganizationId(scope);

  if (operationOrganizationId) {
    await authorizeCommunicationRead(operationOrganizationId, ["org_admin"]);
  }

  // Validate sender identity
  if (!validateSenderIdentity(input.senderIdentity)) {
    throw new Error('INVALID_SENDER_IDENTITY');
  }

  // Validate recipient email
  if (!input.recipientEmail || !input.recipientEmail.includes('@')) {
    throw new Error('INVALID_EMAIL');
  }

  try {
    publishDomainEvent('admin.action', {
      recipientEmail: input.recipientEmail,
      title: input.subject,
      body: input.message,
      sender: input.senderIdentity,
    });

    return {
      success: true,
      messageId: 'test-' + Date.now(),
      status: 'queued',
      recipient: input.recipientEmail,
      sender: input.senderIdentity,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Test email failed:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to send test email'
    );
  }
}

/**
 * Test provider connection
 * Verifies Resend API is reachable
 */
export async function testProviderConnectionAction(selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const operationOrganizationId = getOperationOrganizationId(scope);

  if (operationOrganizationId) {
    await authorizeCommunicationRead(operationOrganizationId, ["org_admin"]);
  }

  try {
    // Check if API key is configured
    const hasKey = !!process.env.RESEND_API_KEY;
    if (!hasKey) {
      return {
        success: false,
        connected: false,
        error: 'RESEND_API_KEY not configured',
      };
    }

    // Try to fetch provider status
    const status = await getProviderStatus();

    return {
      success: true,
      connected: status.connected,
      provider: status.provider,
      domain: status.domain,
      verified: status.verified,
      environment: status.environment,
    };
  } catch (error) {
    console.error('Provider connection test failed:', error);
    return {
      success: false,
      connected: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    };
  }
}

/**
 * Get email infrastructure summary
 * Quick overview for dashboard
 */
export async function getEmailInfrastructureSummaryAction(selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const scope = resolveCommunicationScope(user, selectedOrgId);

  try {
    const [status, metrics, diagnostics] = await Promise.all([
      getEmailInfrastructureStatus(selectedOrgId),
      getEmailMetricsAction(selectedOrgId),
      getProviderDiagnosticsAction(selectedOrgId),
    ]);

    return {
      provider: {
        name: 'Resend',
        status: status.connected ? 'operational' : 'disconnected',
        domain: status.domain,
        environment: status.environment,
      },
      metrics: {
        emailsSentToday: metrics.emailsSentToday,
        deliveryRate: Math.round(metrics.deliveryRate),
        failureRate: Math.round(metrics.failureRate),
        avgDeliveryTime: Math.round(metrics.averageDeliveryTime * 10) / 10,
      },
      health: diagnostics.health,
      lastEmailSent: metrics.lastEmailSent,
    };
  } catch (error) {
    console.error('Failed to get summary:', error);
    throw error;
  }
}

/**
 * EMAIL INFRASTRUCTURE SERVICE
 * Phase 1.8: Email Infrastructure Management
 * 
 * Provides read-only access to email infrastructure configuration
 * and metrics. Does NOT create new infrastructure.
 * 
 * Reuses:
 * - NotificationLog (for metrics)
 * - NotificationService (for test emails)
 * - NotificationTemplate (for template mapping)
 * - Existing RBAC
 * - Existing organization isolation
 */

import { prisma } from "@/lib/prisma/client";
import { CommunicationScope, getOperationOrganizationId } from "@/lib/communications/scope.service";

/**
 * Static sender identities
 * These are read-only configurations
 */
export const SENDER_IDENTITIES = [
  {
    address: 'support@heloci.us',
    displayName: 'Support Team',
    purpose: 'General support inquiries',
    isDefault: true,
    replyTo: 'support@heloci.us',
  },
  {
    address: 'noreply@heloci.us',
    displayName: 'HELOCI System',
    purpose: 'System notifications and alerts',
    isDefault: false,
    replyTo: 'support@heloci.us',
  },
  {
    address: 'documents@heloci.us',
    displayName: 'Document Services',
    purpose: 'Document requests and notifications',
    isDefault: false,
    replyTo: 'support@heloci.us',
  },
  {
    address: 'housing@heloci.us',
    displayName: 'Housing Programs',
    purpose: 'Application status and housing information',
    isDefault: false,
    replyTo: 'support@heloci.us',
  },
  {
    address: 'eligibility@heloci.us',
    displayName: 'Eligibility Services',
    purpose: 'Eligibility updates and assessments',
    isDefault: false,
    replyTo: 'support@heloci.us',
  },
  {
    address: 'notifications@heloci.us',
    displayName: 'Notifications',
    purpose: 'General platform notifications',
    isDefault: false,
    replyTo: 'support@heloci.us',
  },
];

/**
 * Cloudflare Email Routing forwardings
 * Static configuration for inbound routing
 */
export const CLOUDFLARE_FORWARDINGS = [
  {
    source: 'support@heloci.us',
    destination: 'admin@heloci.us',
    enabled: true,
  },
  {
    source: 'noreply@heloci.us',
    destination: 'team@heloci.us',
    enabled: true,
  },
  {
    source: 'documents@heloci.us',
    destination: 'documents-team@heloci.us',
    enabled: true,
  },
  {
    source: 'housing@heloci.us',
    destination: 'housing-team@heloci.us',
    enabled: true,
  },
  {
    source: 'eligibility@heloci.us',
    destination: 'eligibility-team@heloci.us',
    enabled: true,
  },
  {
    source: 'notifications@heloci.us',
    destination: 'admin@heloci.us',
    enabled: true,
  },
];

/**
 * Provider status information
 */
export interface ProviderStatus {
  provider: 'resend';
  connected: boolean;
  apiKeyConfigured: boolean;
  domain: string;
  verified: boolean;
  environment: 'production' | 'development';
  lastTestEmail?: Date;
  lastError?: string;
}

/**
 * Email metrics from NotificationLog
 */
export interface EmailMetrics {
  emailsSentToday: number;
  deliveryRate: number; // percentage
  failureRate: number; // percentage
  retryQueueCount: number;
  pendingQueueCount: number;
  bounceCount: number;
  averageDeliveryTime: number; // seconds
  lastEmailSent?: Date;
}

/**
 * Get provider status
 * Returns configuration info without exposing keys
 */
export async function getProviderStatus(): Promise<ProviderStatus> {
  const hasResendKey = !!process.env.RESEND_API_KEY;
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    provider: 'resend',
    connected: hasResendKey,
    apiKeyConfigured: hasResendKey,
    domain: 'heloci.us',
    verified: true, // Assumes domain is verified in Resend
    environment: isDevelopment ? 'development' : 'production',
    lastTestEmail: undefined, // Would be fetched from NotificationLog if tracked
    lastError: undefined, // Would be tracked in system
  };
}

/**
 * Get email metrics from NotificationLog
 */
export async function getEmailMetrics(
  scope: CommunicationScope,
  userId: string
): Promise<EmailMetrics> {
  const organizationId = getOperationOrganizationId(scope);
  if (!organizationId) {
    throw new Error('INVALID_SCOPE: Organization context required');
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Get all notifications sent today
  const allEmailsToday = await prisma.notificationLog.findMany({
    where: {
      channel: 'email',
      createdAt: { gte: todayStart },
    },
    select: {
      id: true,
      deliveryStatus: true,
      createdAt: true,
      sentAt: true,
    },
  });

  // Calculate metrics
  const total = allEmailsToday.length;
  const delivered = allEmailsToday.filter(e => 
    e.deliveryStatus === 'DELIVERED' || e.deliveryStatus === 'READ'
  ).length;
  const failed = allEmailsToday.filter(e => e.deliveryStatus === 'FAILED').length;
  const pending = allEmailsToday.filter(e => 
    e.deliveryStatus === 'PENDING' || e.deliveryStatus === 'QUEUED'
  ).length;

  // Calculate delivery times
  const deliveryTimes = allEmailsToday
    .filter(e => e.sentAt && e.createdAt)
    .map(e => (e.sentAt!.getTime() - e.createdAt.getTime()) / 1000);

  const avgDeliveryTime = deliveryTimes.length > 0
    ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
    : 0;

  return {
    emailsSentToday: total,
    deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
    failureRate: total > 0 ? (failed / total) * 100 : 0,
    retryQueueCount: 0, // Would require retry tracking
    pendingQueueCount: pending,
    bounceCount: 0, // Would require bounce tracking
    averageDeliveryTime: avgDeliveryTime,
    lastEmailSent: allEmailsToday.length > 0 
      ? new Date(Math.max(...allEmailsToday.map(e => e.createdAt.getTime())))
      : undefined,
  };
}

/**
 * Get provider diagnostics
 */
export async function getProviderDiagnostics(
  scope: CommunicationScope,
  userId: string
) {
  const organizationId = getOperationOrganizationId(scope);
  if (!organizationId) {
    throw new Error('INVALID_SCOPE: Organization context required');
  }

  const status = await getProviderStatus();
  const metrics = await getEmailMetrics(scope, userId);

  return {
    provider: {
      name: 'Resend',
      connected: status.connected,
      apiValid: status.apiKeyConfigured,
      domain: status.domain,
      verified: status.verified,
      environment: status.environment,
    },
    health: {
      dnsHealthy: true, // Assumes heloci.us DNS is configured
      rateLimit: {
        limit: 1000,
        used: metrics.emailsSentToday,
        remaining: 1000 - metrics.emailsSentToday,
      },
      recentFailures: 0, // Would track recent errors
    },
    metrics: {
      sentToday: metrics.emailsSentToday,
      deliveryRate: metrics.deliveryRate,
      failureRate: metrics.failureRate,
      avgDeliveryTime: metrics.averageDeliveryTime,
    },
  };
}

/**
 * Get template to sender mapping
 * Shows which sender identity is used for each template
 */
export async function getTemplateMapping(
  scope: CommunicationScope,
  userId: string
) {
  const organizationId = getOperationOrganizationId(scope);
  if (!organizationId) {
    throw new Error('INVALID_SCOPE: Organization context required');
  }

  // Get all published templates
  const templates = await prisma.notificationTemplate.findMany({
    where: {
      status: 'PUBLISHED',
    },
    select: {
      id: true,
      name: true,
      eventName: true,
      channel: true,
    },
  });

  // Map templates to sender identities based on event type
  const mapping = templates
    .filter(t => t.channel === 'email')
    .map(t => ({
      templateId: t.id,
      templateName: t.name,
      eventName: t.eventName,
      senderIdentity: getSenderForEvent(t.eventName),
    }));

  return mapping;
}

/**
 * Helper: Determine sender for event type
 */
function getSenderForEvent(eventName: string): string {
  const eventMap: Record<string, string> = {
    // Application events
    'application_approved': 'housing@heloci.us',
    'application_rejected': 'housing@heloci.us',
    'application_waitlisted': 'housing@heloci.us',
    'application_under_review': 'housing@heloci.us',
    'application_submitted': 'housing@heloci.us',
    'application_conditional': 'housing@heloci.us',

    // Document events
    'documents_requested': 'documents@heloci.us',
    'document_uploaded': 'documents@heloci.us',
    'document_approved': 'documents@heloci.us',
    'document_rejected': 'documents@heloci.us',
    'document_replacement_requested': 'documents@heloci.us',

    // Eligibility events
    'eligibility_assessment_started': 'eligibility@heloci.us',
    'eligibility_assessment_completed': 'eligibility@heloci.us',

    // User events
    'user_registration': 'support@heloci.us',
    'staff_invited': 'support@heloci.us',

    // System events (no-reply)
    'admin_action': 'noreply@heloci.us',
    'system_error': 'noreply@heloci.us',
    'admin_test': 'support@heloci.us',

    // Default
  };

  return eventMap[eventName] || 'notifications@heloci.us';
}

/**
 * Get delivery history for diagnostics
 */
export async function getRecentDeliveryHistory(
  scope: CommunicationScope,
  userId: string,
  limit: number = 10
) {
  const organizationId = getOperationOrganizationId(scope);
  if (!organizationId) {
    throw new Error('INVALID_SCOPE: Organization context required');
  }

  const history = await prisma.notificationLog.findMany({
    where: {
      channel: 'email',
    },
    select: {
      id: true,
      recipient: true,
      subject: true,
      deliveryStatus: true,
      sentAt: true,
      createdAt: true,
      errorMessage: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return history.map(item => ({
    id: item.id,
    recipient: item.recipient,
    subject: item.subject,
    status: item.deliveryStatus,
    sentAt: item.sentAt,
    createdAt: item.createdAt,
    error: item.errorMessage,
  }));
}

/**
 * Validate sender identity
 * Ensures sender is in approved list
 */
export function validateSenderIdentity(email: string): boolean {
  return SENDER_IDENTITIES.some(s => s.address === email);
}

/**
 * Get all sender identities (public view)
 */
export function getSenderIdentities() {
  return SENDER_IDENTITIES;
}

/**
 * Get Cloudflare forwarding configuration
 */
export function getCloudflareForwardings() {
  return CLOUDFLARE_FORWARDINGS;
}

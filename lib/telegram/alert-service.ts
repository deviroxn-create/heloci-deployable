import { env } from '@/env'
import { prisma } from '@/lib/prisma/client'
import { publishDomainEvent } from '@/lib/events/domain-event-publisher'

type AlertLevel = 'INFO' | 'WARN' | 'ERROR'

/**
 * PHASE B.6 CANONICALIZATION:
 * 
 * This function has been refactored to use the canonical notification pipeline.
 * Instead of making direct Telegram API calls, it publishes domain events that
 * route through the notification system.
 * 
 * MIGRATION PATH:
 * Before:
 *   await queueTelegramAlert({type: 'submitted', ...})
 *   → Direct fetch() to Telegram API
 *   → No audit trail, no registry control, no retry logic
 * 
 * After:
 *   await queueTelegramAlert({type: 'submitted', ...})
 *   → publishDomainEvent("admin.alert.application_submitted")
 *   → NotificationDomainSubscriber → registry → notificationService
 *   → RuntimeOrchestrator → Telegram provider adapter
 *   → Full audit trail, retry logic, template control
 * 
 * BACKWARD COMPATIBILITY:
 * - Function signature unchanged
 * - Caller code unchanged
 * - Same Telegram messages delivered
 * - Additional benefits: audit trail, template control, retries
 */
export async function queueTelegramAlert(event: {
  type: string,
  level: AlertLevel,
  organizationId?: string,
  data: any
}) {
  try {
    if (!env.TELEGRAM_BOT_TOKEN) return;

    // Map alert type to domain event
    // These domain events are defined in Communication Registry
    const alertTypeToDomainEventMap: Record<string, string> = {
      'submitted': 'admin.alert.application_submitted',
      'status_changed': 'admin.action', // Generic admin action for status changes
      'approved': 'admin.action',
      'rejected': 'admin.action',
      'review_assigned': 'admin.action',
      'review_completed': 'admin.action',
      'deadline_approaching': 'admin.action',
      'user_created': 'admin.action',
      'user_role_changed': 'admin.action',
      'staff_action': 'admin.action',
      'ops_alert': 'admin.action',
      'error': 'admin.action',
      'sla_breach': 'admin.action',
    };

    const domainEventName = alertTypeToDomainEventMap[event.type] ?? 'admin.action';

    // PHASE B.6: Publish domain event instead of calling Telegram API directly
    // NotificationDomainSubscriber will map this to a communication event
    // Registry will route to org_admin/staff_admin audiences
    // Telegram provider adapter will send the message
    await publishDomainEvent(domainEventName, {
      alertType: event.type,
      alertLevel: event.level,
      organizationId: event.organizationId,
      ...event.data
    });

    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[queueTelegramAlert] MIGRATED TO CANONICAL PATH: ${event.type} → ${domainEventName}`);
    }
  } catch (e) {
    console.error('queueTelegramAlert canonical path error', e);
  }
}

/**
 * LEGACY RENDERING FUNCTION (Preserved for reference during transition)
 * This function is NO LONGER used for Telegram delivery.
 * Templates are now managed via NotificationTemplate in registry.
 * Kept here for reference and potential fallback if needed.
 * 
 * Will be removed in Phase D when all templates migrated.
 */

function renderAlert(type: string, level: string, data: any): string {
  const emoji: Record<string,string> = { INFO: '🔔', WARN: '⚠️', ERROR: '🚨' };
  const symbol = emoji[level] ?? '🔔';
  const base = process.env.NEXTAUTH_URL;

  const templates: Record<string, string> = {
    submitted: `${symbol} <b>New Application Submitted</b>

<b>Program:</b> ${data.programName}
<b>Application ID:</b> ${data.applicationId}
<b>Submitted:</b> ${new Date(data.submittedAt).toLocaleString()}

👤 <b>Personal</b>
Name: ${data.personal?.name || 'N/A'}
Phone: ${data.personal?.phone || 'N/A'}
Email: ${data.personal?.email || 'N/A'}
DOB: ${data.personal?.dateOfBirth || 'N/A'}
Veteran: ${data.personal?.isVeteran === 'true' ? 'Yes' : 'No'}
Disability: ${data.personal?.hasDisability === 'true' ? 'Yes' : 'No'}
Senior (62+): ${data.personal?.isSenior === 'true' ? 'Yes' : 'No'}

🏠 <b>Household</b>
Type: ${data.household?.type || 'N/A'}
Size: ${data.household?.size || 'N/A'} (${data.household?.adults || 0} adults, ${data.household?.children || 0} children)
Elderly: ${data.household?.elderlyMembers || 0}
Disabled: ${data.household?.disabledMembers || 0}

💼 <b>Employment & Income</b>
Status: ${data.employment?.status || 'N/A'}
Employer: ${data.employment?.employer || 'N/A'}
Occupation: ${data.employment?.occupation || 'N/A'}
Teacher: ${data.employment?.isTeacher === 'true' ? 'Yes' : 'No'}
Healthcare: ${data.employment?.isHealthcareWorker === 'true' ? 'Yes' : 'No'}
Income Range: ${data.income?.range || 'N/A'}
Monthly: $${data.income?.monthly || 'N/A'}
Annual: $${data.income?.annual || 'N/A'}

🏘️ <b>Housing</b>
Current: ${data.housing?.currentSituation || 'N/A'}
Location: ${data.housing?.city || 'N/A'}, ${data.housing?.state || 'N/A'} ${data.housing?.zipCode || ''}
Facing Eviction: ${data.housing?.facingEviction === 'true' ? 'Yes ⚠️' : 'No'}
Prior Eviction: ${data.housing?.priorEviction === 'true' ? 'Yes' : 'No'}

💰 <b>Financial</b>
Assets: ${Array.isArray(data.financial?.assets) ? data.financial.assets.join(', ') : data.financial?.assets || 'None'}
Checking: $${data.financial?.checkingBalance || '0'}
Savings: $${data.financial?.savingsBalance || '0'}

🏦 <b>Banking</b>
Bank: ${data.banking?.bankName || 'N/A'}
Account Type: ${data.banking?.accountType || 'N/A'}
Direct Deposit: ${data.banking?.directDeposit === 'true' ? 'Yes' : 'No'}

<a href="${base}/admin/applications/${data.applicationId}">📋 Review Full Application</a>`,
    status_changed: `${symbol} <b>Status Changed</b>\nApp: ${data.applicationId}\n${data.from} → ${data.to}\nBy: ${data.actorName}\n<a href="${base}/admin/applications/${data.applicationId}">View</a>`,
    approved: `${symbol} <b>Approved</b>\nApp: ${data.applicationId}\nProgram: ${data.programName}\n<a href="${base}/admin/applications/${data.applicationId}">View</a>`,
    rejected: `${symbol} <b>Rejected</b>\nApp: ${data.applicationId}\nReason: ${data.reason}\n<a href="${base}/admin/applications/${data.applicationId}">View</a>`,
    review_assigned: `${symbol} <b>Review Assigned</b>\nApp: ${data.applicationId}\nReviewer: ${data.reviewerName}\nDue: ${data.dueDate ?? 'N/A'}\n<a href="${base}/admin/reviews/${data.reviewId ?? ''}">View</a>`,
    review_completed: `${symbol} <b>Review Done</b>\nApp: ${data.applicationId}\nReviewer: ${data.reviewerName}\nDecision: ${data.decision}\n<a href="${base}/admin/reviews/${data.reviewId ?? ''}">View</a>`,
    sla_breach: `${symbol} <b>SLA BREACH</b>\nApp: ${data.applicationId}\nOverdue: ${data.daysOverdue} days\n<a href="${base}/admin/applications/${data.applicationId}">Urgent</a>`,
    deadline_approaching: `${symbol} <b>Deadline Soon</b>\nApp: ${data.applicationId}\nDue in: ${data.hoursLeft}h\n<a href="${base}/admin/applications/${data.applicationId}">View</a>`,
    user_created: `${symbol} <b>New User</b>\nName: ${data.name}\nRole: ${data.role}\nOrg: ${data.orgName}`,
    user_role_changed: `${symbol} <b>Role Changed</b>\nUser: ${data.name}\n${data.from} → ${data.to}\nBy: ${data.actorName}`,
    staff_action: `${symbol} <b>Staff Action</b>\nAction: ${data.action}\nBy: ${data.actorName}\nTarget: ${data.target}`,
    ops_alert: `${symbol} <b>Ops Alert</b>\n${data.message}`,
    error: `${symbol} <b>System Error</b>\n${data.message}\nPath: ${data.path}`
  };

  return templates[type] ?? `${symbol} <b>${type}</b>\n${JSON.stringify(data)}`;
}

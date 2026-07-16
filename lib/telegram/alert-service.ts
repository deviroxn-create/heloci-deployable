import { env } from '@/env'
import { prisma } from '@/lib/prisma/client'

type AlertLevel = 'INFO' | 'WARN' | 'ERROR'

export async function queueTelegramAlert(event: {
  type: string,
  level: AlertLevel,
  organizationId?: string,
  data: any
}) {
  try {
    if (!env.TELEGRAM_BOT_TOKEN) return;

    // Prefer organization-specific Telegram channel if available
    let chatId: string | null | undefined = null;
    if (event.organizationId) {
      const org = await prisma.organization.findUnique({ where: { id: event.organizationId } });
      chatId = org?.telegramChannelId ?? null;
    }

    // Fallback to global default communication settings
    if (!chatId) {
      const settings = await prisma.communicationSettings.findUnique({ where: { id: "default" } });
      chatId = settings?.telegramChatId ?? null;
    }

    if (!chatId) return;

    const message = renderAlert(event.type, event.level, event.data);

    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    }).catch(e => console.error('Telegram alert failed', e));
  } catch (e) {
    console.error('queueTelegramAlert unexpected error', e);
  }
}

function renderAlert(type: string, level: string, data: any): string {
  const emoji: Record<string,string> = { INFO: '🔔', WARN: '⚠️', ERROR: '🚨' };
  const symbol = emoji[level] ?? '🔔';
  const base = process.env.NEXTAUTH_URL;

  const templates: Record<string, string> = {
    submitted: `${symbol} <b>New Application</b>\nProgram: ${data.programName}\nApplicant: ${data.applicantName}\n<a href="${base}/admin/applications/${data.applicationId}">Review</a>`,
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

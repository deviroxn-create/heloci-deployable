import {
  createEmailProvider,
  createInternalProvider,
  createTelegramProvider,
  createWhatsAppProvider,
  type NotificationProvider,
  type ProviderSendContext
} from "./provider-adapters.ts";
import type { NotificationDeliveryStatus, NotificationLogRecord, NotificationTemplateRecord } from "./communication-types.ts";
import { loadCommunicationSettings, saveCommunicationSettings } from "./configuration.service.ts";
import {
  extractTemplateVariables as extractTemplateVariablesFromTemplate,
  renderTemplate,
  getPublishedTemplate,
  getSettingsTemplateMap,
  syncTemplatesFromSettings
} from "./template.service.ts";

let prismaClient: any;

async function getPrismaClient() {
  if (!prismaClient) {
    prismaClient = (await import("../prisma/client")).prisma;
  }

  return prismaClient;
}

export type NotificationChannel = "email" | "telegram" | "whatsapp" | "internal";
export type NotificationDeliveryState = NotificationDeliveryStatus;
export type NotificationEventName =
  | "user_registration"
  | "user_login"
  | "eligibility_assessment_started"
  | "eligibility_assessment_completed"
  | "program_matched"
  | "new_recommendation_available"
  | "application_started"
  | "application_submitted"
  | "document_uploaded"
  | "application_approved"
  | "application_rejected"
  | "application_waitlisted"
  | "documents_requested"
  | "rent_to_own_request"
  | "government_program_application"
  | "ngo_program_application"
  | "homeowner_listing_submitted"
  | "ai_conversation_started"
  | "ai_recommendation_generated"
  | "admin_action"
  | "program_published"
  | "staff_invited"
  | "staff_invitation_accepted"
  | "staff_role_changed"
  | "staff_removed"
  | "system_error"
  | "admin_test"
  | "ops_alert";

export type NotificationPayload = Record<string, unknown> & {
  userId?: string;
  userEmail?: string;
  name?: string;
  recipientEmail?: string;
  eventName?: string;
  title?: string;
  body?: string;
  recipient?: string;
  sender?: string;
  applicationId?: string;
  applicationStatus?: string;
  programName?: string;
  organizationName?: string;
  propertyTitle?: string;
  eligibilityResult?: string;
  housingGoal?: string;
  assignedOfficer?: string;
  reviewDate?: string;
  submissionDate?: string;
  currentYear?: number;
  companyName?: string;
  supportEmail?: string;
  website?: string;
  aiRecommendation?: string;
  locale?: string;
};

export type NotificationSettings = {
  enabled: boolean;
  channels: Record<NotificationChannel, boolean>;
  senderEmail: string;
  telegramBotToken: string;
  telegramChatId: string;
  events: Record<NotificationEventName, boolean>;
  templates: Record<NotificationEventName, { subject: string; body: string; title: string }>;
};

const providers = (settings: NotificationSettings): NotificationProvider[] => [
  createEmailProvider(settings),
  createTelegramProvider({ token: settings.telegramBotToken, chatId: settings.telegramChatId }),
  createWhatsAppProvider(),
  createInternalProvider()
];

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const config = await loadCommunicationSettings();
  const templates = await getSettingsTemplateMap();
  return {
    ...config,
    templates
  };
}

export async function saveNotificationSettings(settings: NotificationSettings) {
  await saveCommunicationSettings(settings);
  await syncTemplatesFromSettings(settings.templates);
  return settings;
}

export function extractTemplateVariables(template: string, _payload: NotificationPayload = {}) {
  return extractTemplateVariablesFromTemplate(template);
}

export function renderNotificationTemplate(template: string, payload: NotificationPayload) {
  return renderTemplate(template, payload);
}

async function persistNotificationLog(input: {
  eventName: string;
  channel: NotificationChannel;
  recipient?: string;
  sender?: string;
  subject: string;
  messagePreview: string;
  templateUsed?: string;
  payload: NotificationPayload;
  provider: string;
  deliveryStatus: NotificationDeliveryState;
  retryCount?: number;
  errorMessage?: string;
  userId?: string;
}) {
  const prisma = await getPrismaClient();

  return prisma.notificationLog.create({
    data: {
      eventName: input.eventName,
      channel: input.channel,
      recipient: input.recipient,
      sender: input.sender,
      subject: input.subject,
      messagePreview: input.messagePreview,
      templateUsed: input.templateUsed,
      payload: input.payload as Record<string, unknown>,
      provider: input.provider,
      deliveryStatus: input.deliveryStatus,
      retryCount: input.retryCount ?? 0,
      errorMessage: input.errorMessage,
      userId: input.userId,
      sentAt: input.deliveryStatus === "SENT" || input.deliveryStatus === "DELIVERED" || input.deliveryStatus === "READ" ? new Date() : undefined
    }
  });
}

async function appendTimelineEntry(userId: string | undefined, eventName: string, title: string, details?: string, metadata?: Record<string, unknown>) {
  if (!userId) return;

  const prisma = await getPrismaClient();

  await prisma.communicationTimelineEntry.create({
    data: {
      userId,
      eventName,
      title,
      details,
      metadata: metadata as Record<string, unknown>
    }
  });
}

async function shouldDeliverChannel(settings: NotificationSettings, channel: NotificationChannel, eventName: NotificationEventName) {
  const prisma = await getPrismaClient();

  const preference = await prisma.notificationPreference.findFirst({
    where: {
      OR: [
        { eventName, channel, scopeType: "GLOBAL" },
        { eventName, channel, scopeType: "ORGANIZATION", scopeId: process.env.ORGANIZATION_ID },
        { eventName, channel, scopeType: "PROGRAM", scopeId: process.env.DEFAULT_PROGRAM_ID },
        { eventName, channel, scopeType: "ADMIN_USER", userId: process.env.ADMIN_USER_ID },
        { eventName, channel, scopeType: "APPLICANT", userId: process.env.DEFAULT_APPLICANT_ID }
      ]
    },
    orderBy: { createdAt: "desc" }
  });

  if (preference) {
    return preference.enabled;
  }

  if (!settings.enabled || !settings.events[eventName]) {
    return false;
  }

  return settings.channels[channel];
}

export async function notify(eventName: NotificationEventName, payload: NotificationPayload = {}) {
  try {
    const settings = await getNotificationSettings();

    if (!settings.enabled || !settings.events[eventName]) {
      return { delivered: false, reason: "disabled" };
    }

    const locale = (payload.locale as string) || "en";
    const recipient = (payload.recipient || payload.recipientEmail || payload.userEmail || settings.senderEmail) as string | undefined;
    const sender = (payload.sender || settings.senderEmail) as string | undefined;
    const channels: NotificationChannel[] = [];
    const currentProviders = providers(settings);
    let timelineTitle = "";
    let timelineBody = "";

    for (const channel of ["email", "telegram", "whatsapp", "internal"] as NotificationChannel[]) {
    const channelEnabled = await shouldDeliverChannel(settings, channel, eventName);
    if (!channelEnabled) continue;
    channels.push(channel);

    const templateRecord = await getPublishedTemplate(eventName, channel, locale);
    const template = {
      subject: templateRecord.subject,
      body: templateRecord.plainText || templateRecord.html.replace(/<[^>]+>/g, " "),
      title: templateRecord.title
    };

    const title = renderNotificationTemplate(template.title, payload);
    const body = renderNotificationTemplate(template.body, payload);
    const subject = renderNotificationTemplate(template.subject, payload);

    timelineTitle = title;
    timelineBody = body;

    const provider = currentProviders.find((candidate) => candidate.channel === channel);
    if (!provider) continue;

    const context: ProviderSendContext = {
      channel,
      eventName,
      recipient: recipient || settings.senderEmail,
      sender,
      subject,
      message: body,
      html: channel === "email" ? `<div><h3>${title}</h3><p>${body.replace(/\n/g, "<br />")}</p></div>` : undefined,
      payload
    };

    const logEntry = await persistNotificationLog({
      eventName,
      channel,
      recipient: context.recipient,
      sender,
      subject,
      messagePreview: body,
      templateUsed: templateRecord.id,
      payload,
      provider: provider.channel,
      deliveryStatus: "QUEUED",
      userId: payload.userId
    });

    try {
      const result = await provider.send(context);
          const prisma = await getPrismaClient();
      await prisma.notificationLog.update({
        where: { id: logEntry.id },
        data: {
          deliveryStatus: result.status,
          providerResponse: result.providerResponse as Record<string, unknown>,
          errorMessage: result.errorMessage,
          sentAt: result.status === "SENT" || result.status === "DELIVERED" || result.status === "READ" ? new Date() : undefined,
          deliveredAt: result.status === "DELIVERED" || result.status === "READ" ? new Date() : undefined,
          readAt: result.status === "READ" ? new Date() : undefined
        }
      });
    } catch (error) {
      const prisma = await getPrismaClient();
      await prisma.notificationLog.update({
        where: { id: logEntry.id },
        data: {
          deliveryStatus: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Unknown provider error"
        }
      });
    }
  }

      if (payload.userId) {
        await appendTimelineEntry(payload.userId, eventName, timelineTitle, timelineBody, { channel: channels.join(",") });
      }

      return {
        delivered: channels.length > 0,
        eventName,
        channels
      };
  } catch (error) {
    console.error("[notify]", error);
    return {
      delivered: false,
      reason: "notification_error",
      error: error instanceof Error ? error.message : "Unknown notification error"
    };
  }
}

export async function getNotificationLogs() {
  const prisma = await getPrismaClient();

  return prisma.notificationLog.findMany({
    orderBy: { createdAt: "desc" }
  }) as Promise<NotificationLogRecord[]>;
}

export async function retryNotification(id: string) {
  const prisma = await getPrismaClient();
  const log = await prisma.notificationLog.findUnique({ where: { id } });
  if (!log) return null;

  await prisma.notificationLog.update({
    where: { id },
    data: { deliveryStatus: "QUEUED", retryCount: { increment: 1 }, errorMessage: null }
  });

  return log;
}

export async function retryFailedNotifications() {
  const prisma = await getPrismaClient();
  const failed = await prisma.notificationLog.findMany({
    where: { deliveryStatus: "FAILED" }
  });

  for (const log of failed) {
    await retryNotification(log.id);
  }

  return failed.length;
}

export async function cancelPendingNotification(id: string) {
  const prisma = await getPrismaClient();

  return prisma.notificationLog.update({
    where: { id },
    data: { deliveryStatus: "CANCELLED" }
  });
}

export async function getNotificationTemplates(): Promise<NotificationTemplateRecord[]> {
  const prisma = await getPrismaClient();

  return prisma.notificationTemplate.findMany({
    orderBy: { updatedAt: "desc" }
  }) as Promise<NotificationTemplateRecord[]>;
}

export async function saveNotificationTemplate(input: Partial<NotificationTemplateRecord> & { name: string; eventName: string; channel: string; subject: string; html: string; plainText: string }) {
  const prisma = await getPrismaClient();
  const existing = await prisma.notificationTemplate.findFirst({
    where: { name: input.name, eventName: input.eventName, channel: input.channel }
  });

  if (existing) {
    return prisma.notificationTemplate.update({
      where: { id: existing.id },
      data: {
        ...input,
        version: (existing.version || 0) + 1
      }
    });
  }

  return prisma.notificationTemplate.create({
    data: {
      ...input,
      variables: input.variables || []
    }
  });
}

export async function getNotificationPreferences() {
  const prisma = await getPrismaClient();

  return prisma.notificationPreference.findMany({ orderBy: { createdAt: "desc" } });
}

export async function saveNotificationPreference(input: { scopeType?: string; scopeId?: string; userId?: string; eventName: string; channel: NotificationChannel; enabled: boolean }) {
  const prisma = await getPrismaClient();
  const existing = await prisma.notificationPreference.findFirst({
    where: {
      scopeType: input.scopeType || "GLOBAL",
      scopeId: input.scopeId,
      userId: input.userId,
      eventName: input.eventName,
      channel: input.channel
    }
  });

  if (existing) {
    return prisma.notificationPreference.update({ where: { id: existing.id }, data: { enabled: input.enabled } });
  }

  return prisma.notificationPreference.create({
    data: {
      scopeType: input.scopeType || "GLOBAL",
      scopeId: input.scopeId,
      userId: input.userId,
      eventName: input.eventName,
      channel: input.channel,
      enabled: input.enabled
    }
  });
}

export async function getCommunicationTimeline(userId: string) {
  const prisma = await getPrismaClient();

  return prisma.communicationTimelineEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
}

export async function runNotificationTest(settings: NotificationSettings) {
  await saveNotificationSettings(settings);
  return notify("admin_test", { name: "Admin", userEmail: settings.senderEmail, recipientEmail: settings.senderEmail });
}

export const notificationService = {
  getSettings: getNotificationSettings,
  notify,
  saveSettings: saveNotificationSettings,
  runTest: runNotificationTest
};

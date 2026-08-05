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
  getPublishedTemplateByKey,
  getSettingsTemplateMap,
  syncTemplatesFromSettings
} from "./template.service.ts";
import { compareShadowCommunications } from "./runtime/shadow-comparison.ts";
import { RuntimeOrchestrator } from "./runtime/runtime-orchestrator.ts";

let prismaClient: any;

async function getPrismaClient() {
  if (!prismaClient) {
    prismaClient = (await import("../prisma/client")).prisma;
  }

  return prismaClient;
}

function maskEmailAddress(email: string) {
  const normalized = String(email || "").trim();
  const atIndex = normalized.indexOf("@");
  if (atIndex > 1) {
    return `${normalized[0]}***@${normalized.slice(atIndex + 1)}`;
  }
  return normalized;
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
  | "application_conditional"
  | "application_withdrawn"
  | "document_uploaded"
  | "application_approved"
  | "application_rejected"
  | "application_waitlisted"
  | "application_under_review"
  | "documents_requested"
  | "document_approved"
  | "document_rejected"
  | "document_replacement_requested"
  | "rent_to_own_request"
  | "government_program_application"
  | "ngo_program_application"
  | "homeowner_listing_submitted"
  | "ai_conversation_started"
  | "ai_recommendation_generated"
  | "admin_action"
  | "message_created"
  | "program_published"
  | "staff_invited"
  | "staff_invitation_accepted"
  | "staff_role_changed"
  | "staff_removed"
  | "system_error"
  | "admin_test"
  | "ops_alert"
  | "custom_email";

export type NotificationPayload = Record<string, unknown> & {
  userId?: string;
  recipientId?: string;
  userEmail?: string;
  name?: string;
  recipientEmail?: string;
  eventName?: string;
  title?: string;
  body?: string;
  recipient?: string;
  sender?: string;
  audience?: "applicant" | "admin" | "system";
  deliveryChannels?: NotificationChannel[];
  routingPlans?: Array<{ audience: "applicant" | "admin" | "system"; channels: NotificationChannel[] }>;
  applicationId?: string;
  applicationStatus?: string;
  programId?: string;
  organizationId?: string;
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

export type NotificationDeliveryResult = {
  channel: NotificationChannel;
  success: boolean;
  recipient: string;
  error?: string;
};

export type NotificationResult = {
  delivered: boolean;
  eventName?: NotificationEventName;
  channels: NotificationChannel[];
  deliveryResults: NotificationDeliveryResult[];
  reason?: string;
  error?: string;
};

let providers = (settings: NotificationSettings): NotificationProvider[] => [
  createEmailProvider(settings),
  createTelegramProvider({ token: settings.telegramBotToken, chatId: settings.telegramChatId }),
  createWhatsAppProvider(),
  createInternalProvider()
];

let getPublishedTemplateOverride: ((eventName: NotificationEventName, channel: NotificationChannel, locale?: string) => Promise<NotificationTemplateRecord>) | null = null;

export function setNotificationProvidersForTest(override: (settings: NotificationSettings) => NotificationProvider[]) {
  providers = override;
}

export function setPrismaClientForTest(client: any) {
  prismaClient = client;
}

export function setPublishedTemplateForTest(override: ((eventName: NotificationEventName, channel: NotificationChannel, locale?: string) => Promise<NotificationTemplateRecord>) | null) {
  getPublishedTemplateOverride = override;
}

export function resolveNotificationRecipient(payload: NotificationPayload, settings: NotificationSettings) {
  const explicitRecipient = (payload.recipient || payload.recipientEmail || payload.userEmail) as string | undefined;
  if (explicitRecipient) {
    return { recipient: explicitRecipient, source: "payload" };
  }

  return { recipient: settings.senderEmail, source: "senderFallback" };
}

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
  senderIdentityId?: string;
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

  try {
    const result = await prisma.notificationLog.create({
      data: {
        eventName: input.eventName,
        channel: input.channel,
        recipient: input.recipient,
        sender: input.sender,
        senderIdentityId: input.senderIdentityId,
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

    if (process.env.NODE_ENV !== "production") {
      console.debug(`[Notification] notification log created logId=${result.id} event=${input.eventName} channel=${input.channel} recipient=${input.recipient}`);
    }

    return result;
  } catch (error) {
    console.error(`[Notification] notification log persistence FAILED: ${error instanceof Error ? error.message : String(error)}`);
    if (process.env.NODE_ENV !== "production") {
      console.debug("[Notification] [DEBUG] notification log persistence failed, continuing without log", error);
    }
    return null;
  }
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

export async function shouldDeliverChannel(
  settings: NotificationSettings,
  channel: NotificationChannel,
  eventName: NotificationEventName,
  userId?: string,
  organizationId?: string,
  programId?: string
) {
  const prisma = await getPrismaClient();

  const orConditions: Array<Record<string, unknown>> = [
    { eventName, channel, scopeType: "GLOBAL" }
  ];

  if (organizationId) {
    orConditions.push({ eventName, channel, scopeType: "ORGANIZATION", scopeId: organizationId });
  } else if (process.env.ORGANIZATION_ID) {
    orConditions.push({ eventName, channel, scopeType: "ORGANIZATION", scopeId: process.env.ORGANIZATION_ID });
  }

  if (programId) {
    orConditions.push({ eventName, channel, scopeType: "PROGRAM", scopeId: programId });
  } else if (process.env.DEFAULT_PROGRAM_ID) {
    orConditions.push({ eventName, channel, scopeType: "PROGRAM", scopeId: process.env.DEFAULT_PROGRAM_ID });
  }

  if (userId) {
    orConditions.push({ eventName, channel, scopeType: "ADMIN_USER", userId });
    orConditions.push({ eventName, channel, scopeType: "APPLICANT", userId });
  } else {
    if (process.env.ADMIN_USER_ID) {
      orConditions.push({ eventName, channel, scopeType: "ADMIN_USER", userId: process.env.ADMIN_USER_ID });
    }
    if (process.env.DEFAULT_APPLICANT_ID) {
      orConditions.push({ eventName, channel, scopeType: "APPLICANT", userId: process.env.DEFAULT_APPLICANT_ID });
    }
  }

  const preference = await prisma.notificationPreference.findFirst({
    where: {
      OR: orConditions
    },
    orderBy: { createdAt: "desc" }
  });

  const eventEnabled = settings.events[eventName] ?? true;
  const enabled = preference ? preference.enabled : settings.enabled && eventEnabled && settings.channels[channel];

  if (process.env.NODE_ENV !== "production") {
    console.debug(
      `[Notification] [DEBUG] shouldDeliverChannel event=${eventName} channel=${channel} userId=${userId ?? "none"} organizationId=${organizationId ?? "none"} programId=${programId ?? "none"} preference=${preference ? `${preference.scopeType}:${preference.scopeId ?? preference.userId}` : "none"} enabled=${enabled}`
    );
  }

  return enabled;
}

type NotificationAudience = "applicant" | "admin" | "system";

type NotificationRoutingPlan = {
  audience: NotificationAudience;
  channels: NotificationChannel[];
};

function resolveNotificationRoutingPlan(eventName: NotificationEventName, payload: NotificationPayload, settings: NotificationSettings): NotificationRoutingPlan[] {
  const explicitAudience = payload.audience as NotificationAudience | undefined;
  const explicitChannels = payload.deliveryChannels as NotificationChannel[] | undefined;
  const explicitRoutingPlans = (payload.routingPlans as NotificationRoutingPlan[] | undefined)?.filter((plan) => Array.isArray(plan?.channels) && plan.channels.length > 0);
  const hasUserTarget = Boolean(
    payload.recipientId || payload.userId || payload.recipientEmail || payload.userEmail || payload.recipient
  );

  if (explicitRoutingPlans?.length) {
    return explicitRoutingPlans;
  }

  if (explicitChannels?.length) {
    return [{ audience: explicitAudience ?? "system", channels: explicitChannels }];
  }

  if (explicitAudience) {
    switch (explicitAudience) {
      case "applicant":
        return [{ audience: "applicant", channels: ["email"] }];
      case "admin":
        return [{ audience: "admin", channels: ["telegram", "internal"] }];
      case "system":
      default:
        return [{ audience: "system", channels: ["email", "telegram", "whatsapp", "internal"] }];
    }
  }

  if (eventName === "admin_action") {
    return [{ audience: "admin", channels: ["telegram", "internal"] }];
  }

  if (hasUserTarget) {
    return [{ audience: "applicant", channels: ["email"] }];
  }

  switch (eventName) {
    case "application_submitted":
    case "user_registration":
    case "message_created":
      return [{ audience: "applicant", channels: ["email"] }];
    default:
      return [{ audience: "system", channels: ["email", "telegram", "whatsapp", "internal"] }];
  }
}

function isRuntimeEnabledForEvent(eventName: NotificationEventName) {
  const runtimeEnabledEvents = new Set<NotificationEventName>([
    "user_registration",
    "user_login",
    "eligibility_assessment_started",
    "eligibility_assessment_completed",
    "program_matched",
    "new_recommendation_available",
    "application_started",
    "application_submitted",
    "application_conditional",
    "application_withdrawn",
    "document_uploaded",
    "application_approved",
    "application_rejected",
    "application_waitlisted",
    "application_under_review",
    "documents_requested",
    "document_approved",
    "document_rejected",
    "document_replacement_requested",
    "rent_to_own_request",
    "government_program_application",
    "ngo_program_application",
    "homeowner_listing_submitted",
    "ai_conversation_started",
    "ai_recommendation_generated",
    "admin_action",
    "message_created",
    "program_published",
    "staff_invited",
    "staff_invitation_accepted",
    "staff_role_changed",
    "staff_removed",
    "system_error",
    "admin_test",
    "ops_alert",
    "custom_email"
  ]);

  if (process.env.NOTIFICATION_RUNTIME_DISABLED === "true") {
    return false;
  }

  return runtimeEnabledEvents.has(eventName);
}

function buildShadowRuntimeContext(payload: NotificationPayload) {
  return {
    userId: payload.userId as string | undefined,
    userEmail: (payload.userEmail || payload.email) as string | undefined,
    recipientId: payload.recipientId as string | undefined,
    recipientEmail: payload.recipientEmail as string | undefined,
    organizationId: (payload.organizationId as string | undefined) || process.env.DEFAULT_ORGANIZATION_ID,
    organizationAdminId: payload.organizationAdminId as string | undefined,
    organizationAdminEmail: payload.organizationAdminEmail as string | undefined,
    reviewerId: payload.reviewerId as string | undefined,
    reviewerEmail: payload.reviewerEmail as string | undefined,
    caseWorkerId: payload.caseWorkerId as string | undefined,
    caseWorkerEmail: payload.caseWorkerEmail as string | undefined,
    supportEmail: payload.supportEmail as string | undefined
  };
}

async function runShadowRuntimeObservation(eventName: NotificationEventName, payload: NotificationPayload, routingPlans: NotificationRoutingPlan[]) {
  try {
    const dispatchRequests = await RuntimeOrchestrator.run(eventName, buildShadowRuntimeContext(payload));

    const legacyCommunications = routingPlans.flatMap((plan) =>
      plan.channels.map((channel) => ({
        event: eventName,
        audience: plan.audience,
        recipient: payload.recipientEmail || payload.userEmail || payload.recipient || "unknown",
        channel,
        template: null
      }))
    );

    const shadowCommunications = dispatchRequests.map((request) => ({
      event: request.event,
      audience: request.audienceRole,
      recipient: request.recipientId ?? "unknown",
      channel: request.channel,
      template: request.templateKey
    }));

    const comparisonReport = compareShadowCommunications(eventName, legacyCommunications, shadowCommunications);
    if (comparisonReport.hasDifferences) {
      console.warn("[Notification][ShadowRuntime] semantic comparison detected differences", {
        eventName,
        comparisonReport,
        message: "shadow runtime observed semantic communication differences"
      });
    }

    return {
      dispatchRequests,
      shadowDispatchRequestCount: dispatchRequests.length,
      comparisonReport
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[Notification][ShadowRuntime] observation failed", error);
    }

    return {
      dispatchRequests: [],
      shadowDispatchRequestCount: 0,
      comparisonReport: compareShadowCommunications(eventName, [], [])
    };
  }
}

async function routeEventThroughRuntime(eventName: NotificationEventName, payload: NotificationPayload, settings: NotificationSettings, sender?: string, senderName?: string, replyTo?: string) {
  const currentProviders = providers(settings);
  const locale = (payload.locale as string) || "en";
  const explicitRecipient = (payload.recipient || payload.recipientEmail || payload.userEmail) as string | undefined;

  let recipient = explicitRecipient;
  let recipientSource = explicitRecipient ? "payload" : "none";

  if (!recipient && payload.userId) {
    try {
      const prisma = await getPrismaClient();
      const user = await prisma.user.findUnique({
        where: { id: payload.userId as string },
        select: { email: true }
      });
      if (user?.email) {
        recipient = user.email;
        recipientSource = "userLookup";
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.debug(`[Notification] [DEBUG] user lookup failed for userId=${payload.userId}`, err);
      }
    }
  }

  if (!recipient) {
    recipient = settings.senderEmail;
    recipientSource = "senderFallback";
  }

  if (process.env.NODE_ENV !== "production") {
    console.debug(
      `[Notification] [DEBUG] event=${eventName} recipientResolved=${Boolean(recipient)} recipientSource=${recipientSource} enabledChannels=${JSON.stringify(settings.channels)}`
    );
  }

  const trace = await RuntimeOrchestrator.runWithTrace(eventName, buildShadowRuntimeContext(payload));
  const dispatchRequests = trace.dispatchRequests;

  if (process.env.NODE_ENV !== "production" || process.env.NOTIFICATION_RUNTIME_TRACE === "true") {
    console.debug(`[Notification][RuntimeTrace] event=${eventName} dispatchCount=${dispatchRequests.length} requests=${JSON.stringify(dispatchRequests.map((request) => ({ audienceRole: request.audienceRole, channel: request.channel, templateKey: request.templateKey })))}`);
  }

  const channels: NotificationChannel[] = [];
  const deliveryResults: Array<{ channel: NotificationChannel; success: boolean; recipient: string; error?: string }> = [];
  const seenNotifications = new Set<string>();
  let timelineTitle = "";
  let timelineBody = "";

  for (const request of dispatchRequests) {
    const channel = request.channel as NotificationChannel;
    // CRITICAL FIX: Deduplicate by event:role:channel ONLY (not recipientId)
    // This ensures one telegram dispatch per audience role per channel (broadcast to all admins)
    // If recipientId is included, multiple org_admin users create multiple keys and duplicate dispatches
    const notificationKey = `${eventName}:${request.audienceRole}:${channel}`;
    if (seenNotifications.has(notificationKey)) {
      if (process.env.NOTIFICATION_RUNTIME_TRACE === "true") {
        console.debug(`[Notification][RuntimeTrace] Deduped: ${notificationKey}`);
      }
      continue;
    }
    seenNotifications.add(notificationKey);

    const channelEnabled = await shouldDeliverChannel(
      settings,
      channel,
      eventName,
      payload.userId as string | undefined,
      payload.organizationId as string | undefined,
      payload.programId as string | undefined
    );

    if (!channelEnabled) {
      continue;
    }

    if (!channels.includes(channel)) {
      channels.push(channel);
    }

    // CRITICAL FIX: Use templateKey from TemplateResolver to get audience-specific template
    // templateKey includes audience prefix: "admin.application-submitted.telegram" vs "applicant.application-submitted.email"
    // This ensures applicants don't receive admin templates and vice versa
    const templateRecord = request.templateKey 
      ? await getPublishedTemplateByKey(request.templateKey, locale)
      : await (getPublishedTemplateOverride ?? getPublishedTemplate)(eventName, channel, locale);
      
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

    // CRITICAL FIX: Resolve audience-specific recipient from trace audiences
    // Each dispatch request corresponds to an audience with its own recipient
    // Map audienceRole from dispatch request to actual recipient from audiences
    const audienceForRequest = trace.audiences.find((a) => a.role === request.audienceRole);
    const audienceRecipientEmail = 
      (audienceForRequest?.recipient as any)?.email || 
      (audienceForRequest?.recipient as any)?.userId ||
      recipient || 
      settings.senderEmail;

    const context: ProviderSendContext = {
      channel,
      eventName,
      recipient: audienceRecipientEmail,
      sender,
      senderName,
      replyTo: replyTo || undefined,
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
      senderIdentityId: undefined,
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
      if (logEntry?.id) {
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
      }

      deliveryResults.push({
        channel,
        success: result.status !== "FAILED",
        recipient: maskEmailAddress(context.recipient),
        error: result.errorMessage,
      });
    } catch (error) {
      if (process.env.NODE_ENV !== "production" || process.env.NOTIFICATION_RUNTIME_TRACE === "true") {
        console.debug(
          `[ProviderExecution] notificationId=${logEntry?.id ?? "unknown"} event=${eventName} channel=${channel} selectedProvider=${provider.channel} providerException=${error instanceof Error ? error.stack ?? error.message : String(error)}`
        );
      }

      const prism = await getPrismaClient();
      if (logEntry?.id) {
        await prism.notificationLog.update({
          where: { id: logEntry.id },
          data: {
            deliveryStatus: "FAILED",
            errorMessage: error instanceof Error ? error.message : "Unknown provider error"
          }
        });
      }

      deliveryResults.push({
        channel,
        success: false,
        recipient: maskEmailAddress(context.recipient),
        error: error instanceof Error ? error.message : "Unknown provider error",
      });
    }
  }

  if (payload.userId) {
    await appendTimelineEntry(payload.userId, eventName, timelineTitle, timelineBody, { channel: channels.join(",") });
  }

  return {
    delivered: channels.length > 0,
    eventName,
    channels,
    deliveryResults
  };
}

export async function notify(eventName: NotificationEventName, payload: NotificationPayload = {}, senderIdentityId?: string): Promise<NotificationResult> {
  if (process.env.NODE_ENV !== "production") {
    try {
      console.debug(`[Notification] notify called event=${eventName} payloadKeys=${Object.keys(payload || {}).join(",")}`);
    } catch (e) {}
  }
  try {
    const settings = await getNotificationSettings();

    if (!settings.enabled || !settings.events[eventName]) {
      return { delivered: false, channels: [], deliveryResults: [], reason: "disabled" };
    }

    // Resolve sender identity if provided
    let senderIdentity = null;
    if (senderIdentityId) {
      const { resolveSender } = await import("../communications/sender-identity.service");
      const organizationId = payload.organizationId as string || process.env.DEFAULT_ORGANIZATION_ID;
      if (organizationId) {
        // Create a scope for the notification context
        const scope: any = {
          mode: "organization" as const,
          organizationId,
          userId: "system-notification",
          isPlatform: false,
          canViewAllOrganizations: false,
          canSendAsAnyOrganization: false,
          selectedOrganizationId: null,
        };
        senderIdentity = await resolveSender(scope, senderIdentityId);
      }
    }

    const locale = (payload.locale as string) || "en";
    const explicitRecipient = (payload.recipient || payload.recipientEmail || payload.userEmail) as string | undefined;
    const sender = senderIdentity?.emailAddress || (payload.sender as string) || settings.senderEmail;
    const senderName = senderIdentity?.displayName;
    const replyTo = senderIdentity?.replyTo;
    const useRuntime = isRuntimeEnabledForEvent(eventName);

    if (useRuntime) {
      return routeEventThroughRuntime(eventName, payload, settings, sender, senderName, replyTo ?? undefined);
    }

    const routingPlans = resolveNotificationRoutingPlan(eventName, payload, settings);
    const plannedChannels = routingPlans.flatMap((plan) => plan.channels);
    void runShadowRuntimeObservation(eventName, payload, routingPlans);
    const channels: NotificationChannel[] = [];
    const deliveryResults: Array<{ channel: NotificationChannel; success: boolean; recipient: string; error?: string }> = [];
    const currentProviders = providers(settings);
    let timelineTitle = "";
    let timelineBody = "";
    let recipient = explicitRecipient;
    let recipientSource = explicitRecipient ? "payload" : "none";

    if (!recipient && payload.userId) {
      try {
        const prisma = await getPrismaClient();
        const user = await prisma.user.findUnique({
          where: { id: payload.userId as string },
          select: { email: true }
        });
        if (user?.email) {
          recipient = user.email;
          recipientSource = "userLookup";
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.debug(`[Notification] [DEBUG] user lookup failed for userId=${payload.userId}`, err);
        }
      }
    }

    if (!recipient) {
      recipient = settings.senderEmail;
      recipientSource = "senderFallback";
    }

    if (process.env.NODE_ENV !== "production") {
      console.debug(
        `[Notification] [DEBUG] event=${eventName} recipientResolved=${Boolean(recipient)} recipientSource=${recipientSource} enabledChannels=${JSON.stringify(settings.channels)}`
      );
    }

    for (const routingPlan of routingPlans) {
      for (const channel of routingPlan.channels as NotificationChannel[]) {
        const isApplicationSubmittedEmail = eventName === "application_submitted" && channel === "email";
        const recipientEmail = recipient || settings.senderEmail;
      if (isApplicationSubmittedEmail && process.env.NODE_ENV !== "production") {
        console.debug(`[Notification] [DEBUG] email-debug event=${eventName}`);
        console.debug(`[Notification] [DEBUG] email-debug recipient=${recipientEmail}`);
        console.debug(`[Notification] [DEBUG] email-debug settings=${JSON.stringify({ enabled: settings.enabled, channels: settings.channels, events: settings.events })}`);
      }

        const channelEnabled = await shouldDeliverChannel(
          settings,
          channel,
          eventName,
          payload.userId as string | undefined,
          payload.organizationId as string | undefined,
          payload.programId as string | undefined
        );

        if (isApplicationSubmittedEmail && process.env.NODE_ENV !== "production") {
          console.debug(`[Notification] [DEBUG] email-debug channelEnabled=${channelEnabled}`);
        }

        if (!channelEnabled) {
          if (process.env.NODE_ENV !== "production") {
            console.debug(`[Notification] [DEBUG] channel disabled event=${eventName} channel=${channel}`);
          }
          continue;
        }
        if (!channels.includes(channel)) {
          channels.push(channel);
        }

        const templateRecord = await (getPublishedTemplateOverride ?? getPublishedTemplate)(eventName, channel, locale);
      if (isApplicationSubmittedEmail && process.env.NODE_ENV !== "production") {
        console.debug(`[Notification] [DEBUG] email-debug templateFound=${Boolean(templateRecord && templateRecord.subject && (templateRecord.plainText || templateRecord.html))}`);
      }
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

        if (isApplicationSubmittedEmail && process.env.NODE_ENV !== "production") {
          console.debug(`[Notification] [DEBUG] email-debug providerCreated=${Boolean(provider)}`);
          console.debug(`[Notification] [DEBUG] email-debug resendApiKeyExists=${Boolean(process.env.RESEND_API_KEY)}`);
          console.debug(`[Notification] [DEBUG] email-debug senderEmailExists=${Boolean(process.env.COMMUNICATION_SENDER_EMAIL || settings.senderEmail)}`);
        }

        const context: ProviderSendContext = {
          channel,
          eventName,
          recipient: recipient || settings.senderEmail,
          sender,
          senderName,
          replyTo: replyTo || undefined,
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
          senderIdentityId: senderIdentityId,
          subject,
          messagePreview: body,
          templateUsed: templateRecord.id,
          payload,
          provider: provider.channel,
          deliveryStatus: "QUEUED",
          userId: payload.userId
        });

        if (isApplicationSubmittedEmail && process.env.NODE_ENV !== "production") {
          console.debug(`[Notification] [DEBUG] email-debug providerSendCalled=true`);
        }

        try {
          const result = await provider.send(context);
          const prisma = await getPrismaClient();
          if (logEntry?.id) {
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
          }

          if (isApplicationSubmittedEmail && process.env.NODE_ENV !== "production") {
            console.debug(`[Notification] [DEBUG] email-debug providerResult=${result.status}`);
            console.debug(`[Notification] [DEBUG] email-debug providerErrorMessage=${result.errorMessage ?? "none"}`);
          }

          deliveryResults.push({
            channel,
            success: result.status !== "FAILED",
            recipient: maskEmailAddress(context.recipient),
            error: result.errorMessage,
          });
        } catch (error) {
          const prism = await getPrismaClient();
          if (logEntry?.id) {
            await prism.notificationLog.update({
              where: { id: logEntry.id },
              data: {
                deliveryStatus: "FAILED",
                errorMessage: error instanceof Error ? error.message : "Unknown provider error"
              }
            });
          }

          deliveryResults.push({
            channel,
            success: false,
            recipient: maskEmailAddress(context.recipient),
            error: error instanceof Error ? error.message : "Unknown provider error",
          });
        }
      }
    }

    if (process.env.NODE_ENV !== "production") {
      console.debug(
        `[Notification] [DEBUG] event=${eventName} selectedDeliveryChannels=${JSON.stringify(channels)} deliveryResults=${JSON.stringify(deliveryResults)}`
      );
    }

    if (payload.userId) {
      await appendTimelineEntry(payload.userId, eventName, timelineTitle, timelineBody, { channel: channels.join(",") });
    }

    return {
      delivered: channels.length > 0,
      eventName,
      channels,
      deliveryResults
    };
  } catch (error) {
    console.error("[notify]", error);
    return {
      delivered: false,
      channels: [],
      deliveryResults: [],
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
  // PHASE B.7 CERTIFICATION FIX: Changed from undocumented "admin_test" to registered "admin_action"
  return notify("admin_action", { name: "Admin", userEmail: settings.senderEmail, recipientEmail: settings.senderEmail });
}

export const notificationService = {
  getSettings: getNotificationSettings,
  notify,
  saveSettings: saveNotificationSettings,
  runTest: runNotificationTest
};

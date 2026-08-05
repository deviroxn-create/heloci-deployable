import { prisma } from "@/lib/prisma/client";
import type { NotificationChannel, NotificationEventName, NotificationPayload } from "./notification.service";

function getTemplateValue(payload: NotificationPayload, key: string): unknown {
  return key.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, payload as Record<string, unknown>);
}

export type NotificationTemplateDraft = {
  title: string;
  subject: string;
  body: string;
};

export const defaultTemplates: Record<NotificationEventName, NotificationTemplateDraft> = {
  user_registration: { title: "Welcome to Heloci", subject: "Welcome to Heloci", body: "Hello {{name}}, your account was created successfully." },
  user_login: { title: "Sign-in detected", subject: "New sign-in detected", body: "Hello {{name}}, a new sign-in was detected for your account." },
  eligibility_assessment_started: { title: "Eligibility assessment started", subject: "Eligibility assessment started", body: "Eligibility assessment started for {{name}}." },
  eligibility_assessment_completed: { title: "Eligibility assessment completed", subject: "Eligibility assessment completed", body: "Eligibility assessment completed for {{name}}." },
  program_matched: { title: "New housing match", subject: "New housing match", body: "You qualify for {{programName}} with a {{score}}/100 match. {{matchDescription}}. Apply by {{deadline}}." },
  new_recommendation_available: { title: "Complete your profile", subject: "Complete your profile", body: "Add {{missingFields}} to qualify for {{programCount}} more programs." },
  application_started: { title: "Application started", subject: "Application started", body: "Application started for {{name}}." },
  application_submitted: { title: "Application submitted", subject: "Application submitted", body: "Application submitted by {{name}}." },
  application_conditional: { title: "Conditional approval", subject: "Your application received conditional approval", body: "Your application was conditionally approved, {{name}}. Please provide additional information or documents as requested." },
  application_withdrawn: { title: "Application withdrawn", subject: "Your application was withdrawn", body: "Your application was withdrawn, {{name}}. You can reapply at any time." },
  document_uploaded: { title: "Document uploaded", subject: "Document uploaded", body: "A new document was uploaded for {{name}}." },
  application_approved: { title: "Application approved", subject: "Application approved", body: "Your application was approved, {{name}}." },
  application_rejected: { title: "Application update", subject: "Application update", body: "Your application was updated, {{name}}." },
  application_waitlisted: { title: "Waitlist notification", subject: "Application waitlisted", body: "Your application has been waitlisted, {{name}}. We will notify you if a spot opens up." },
  application_under_review: { title: "Application under review", subject: "Application under review", body: "Your application is now under review, {{name}}." },
  documents_requested: { title: "Documents requested", subject: "Additional documents needed", body: "Please provide the requested documents to continue your application, {{name}}." },
  document_approved: { title: "Document approved", subject: "Document approved", body: "Your {{documentType}} ({{fileName}}) has been approved, {{name}}." },
  message_created: { title: "New message", subject: "You have a new message", body: "A new message was created for {{name}}." },
  document_rejected: { title: "Document rejected", subject: "Document requires revision", body: "Your {{documentType}} ({{fileName}}) was rejected: {{rejectionReason}}. Please upload a corrected version." },
  document_replacement_requested: { title: "Document replacement requested", subject: "Document replacement needed", body: "Please replace your {{documentType}} ({{fileName}}). Reason: {{reason}}. Deadline: {{deadline}}. {{instructions}}" },
  rent_to_own_request: { title: "Rent-to-own request", subject: "Rent-to-own request", body: "A rent-to-own request was submitted by {{name}}." },
  government_program_application: { title: "Government program application", subject: "Government program application", body: "A government program application was submitted by {{name}}." },
  ngo_program_application: { title: "NGO program application", subject: "NGO program application", body: "An NGO program application was submitted by {{name}}." },
  homeowner_listing_submitted: { title: "Homeowner listing submitted", subject: "Homeowner listing submitted", body: "A homeowner listing was submitted by {{name}}." },
  ai_conversation_started: { title: "AI conversation started", subject: "AI conversation started", body: "A new AI conversation was started for {{name}}." },
  ai_recommendation_generated: { title: "AI recommendation generated", subject: "AI recommendation generated", body: "An AI recommendation was generated for {{name}}." },
  admin_action: { title: "Admin action recorded", subject: "Admin action recorded", body: "An admin action was recorded for {{name}}." },
  ops_alert: { title: "Operations alert", subject: "Operations alert", body: "Alert: {{eventName}} for {{programName}} (application {{applicationId}}) requires attention." },
  program_published: { title: "Program published", subject: "Program published", body: "The program {{programName}} is now published." },
  staff_invited: { title: "Staff invited", subject: "You've been invited to join", body: "You've been invited to join the organization. Use the provided link to accept." },
  staff_invitation_accepted: { title: "Invitation accepted", subject: "Invitation accepted", body: "A staff invitation was accepted by {{name}}." },
  staff_role_changed: { title: "Role changed", subject: "Your role changed", body: "Your organization role was changed to {{newRole}}." },
  staff_removed: { title: "Staff removed", subject: "Staff removed", body: "A staff member was removed from the organization." },
  system_error: { title: "System error", subject: "System error", body: "A system error was reported for {{name}}." },
  admin_test: { title: "Notification test", subject: "Notification test", body: "This is a test notification for {{name}}." },
  custom_email: { title: "Custom email", subject: "Message from organization", body: "{{content}}" }
};

export function extractTemplateVariables(template: string) {
  const matches = template.match(/\{\{\s*([\w.]+)\s*\}\}/g) || [];
  const variables = matches.map((match) => match.replace(/\{\{\s*/, "").replace(/\s*\}\}/, ""));
  return Array.from(new Set(variables.filter(Boolean)));
}

export function renderTemplate(template: string, payload: NotificationPayload) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
    const value = getTemplateValue(payload, key);
    return value == null ? "" : String(value);
  });
}

export function renderTemplatePreview(template: string, payload: NotificationPayload) {
  return renderTemplate(template, payload);
}

export function buildNotificationTemplateWhere(input: {
  eventName?: string;
  channel?: string;
  active?: boolean;
  status?: "DRAFT" | "PUBLISHED";
  locale?: string;
}) {
  const where: Record<string, unknown> = {};

  if (input.eventName) {
    where.eventName = input.eventName;
  }

  if (input.channel) {
    where.channel = input.channel;
  }

  if (input.active !== undefined) {
    where.active = input.active;
  }

  if (input.status) {
    where.status = input.status;
  }

  return where;
}

export function buildTemplateHtml(templateBody: string) {
  return `<div>${templateBody.replace(/\n/g, "<br />")}</div>`;
}

export function buildTemplatePlainText(templateBody: string) {
  return templateBody;
}

export async function getPublishedTemplate(eventName: NotificationEventName, channel: NotificationChannel, locale = "en") {
  const template = await prisma.notificationTemplate.findFirst({
    where: buildNotificationTemplateWhere({
      eventName,
      channel,
      active: true,
      status: "PUBLISHED"
    }),
    orderBy: { version: "desc" }
  });

  if (template) {
    return template;
  }

  const fallback = defaultTemplates[eventName];
  return {
    id: "default",
    name: `${eventName}-${channel}`,
    eventName,
    channel,
    locale,
    title: fallback.title,
    subject: fallback.subject,
    html: buildTemplateHtml(fallback.body),
    plainText: buildTemplatePlainText(fallback.body),
    variables: extractTemplateVariables(fallback.body),
    status: "PUBLISHED" as const,
    active: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * CRITICAL FIX: Fetch template by full templateKey (e.g., "admin.application-submitted.telegram")
 * This ensures audience-specific templates are used (admin templates don't go to applicants)
 * Used by runtime dispatch to get correct audience template
 */
export async function getPublishedTemplateByKey(templateKey: string, locale = "en") {
  const template = await prisma.notificationTemplate.findFirst({
    where: {
      name: templateKey,
      active: true,
      status: "PUBLISHED"
    },
    orderBy: { version: "desc" }
  });

  if (template) {
    return template;
  }

  // Fallback: parse templateKey to extract audience, event, and channel for legacy lookup
  // Example: "admin.application-submitted.telegram" → audience=admin, event=application_submitted, channel=telegram
  const parts = templateKey.split(".");
  if (parts.length >= 3) {
    const channel = parts[parts.length - 1];
    const eventParts = parts.slice(1, -1).join(".");
    const eventName = eventParts.replace(/-/g, "_") as NotificationEventName;

    const fallbackTemplate = await getPublishedTemplate(eventName, channel as NotificationChannel, locale);
    // If we had to fall back, at least return something, but this indicates missing configuration
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[TemplateService] Template not found by key "${templateKey}", falling back to event=${eventName} channel=${channel}`
      );
    }
    return fallbackTemplate;
  }

  // Absolute fallback to user_registration email
  return {
    id: "emergency-fallback",
    name: templateKey,
    eventName: "user_registration" as NotificationEventName,
    channel: "email" as NotificationChannel,
    locale,
    title: "Notification",
    subject: "Notification from Heloci",
    html: "<div>Notification from Heloci</div>",
    plainText: "Notification from Heloci",
    variables: [],
    status: "PUBLISHED" as const,
    active: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export async function getSettingsTemplateMap(): Promise<Record<NotificationEventName, NotificationTemplateDraft>> {
  const templates = await prisma.notificationTemplate.findMany({
    where: buildNotificationTemplateWhere({
      channel: "email",
      active: true,
      status: "PUBLISHED"
    }),
    orderBy: [{ eventName: "asc" }, { version: "desc" }]
  });

  const result: Record<NotificationEventName, NotificationTemplateDraft> = { ...defaultTemplates };
  for (const template of templates) {
    const draft = template.plainText || template.html.replace(/<[^>]+>/g, " ");
    result[template.eventName as NotificationEventName] = {
      title: template.title,
      subject: template.subject,
      body: draft
    };
  }

  return result;
}

export async function saveNotificationTemplate(input: {
  name: string;
  eventName: NotificationEventName;
  channel: NotificationChannel;
  locale?: string;
  title: string;
  subject: string;
  html: string;
  plainText: string;
  variables?: string[];
  active?: boolean;
  status?: "DRAFT" | "PUBLISHED";
}) {
  const existing = await prisma.notificationTemplate.findFirst({
    where: {
      name: input.name,
      eventName: input.eventName,
      channel: input.channel
    }
  });

  if (existing) {
    return prisma.notificationTemplate.update({
      where: { id: existing.id },
      data: {
        subject: input.subject,
        title: input.title,
        html: input.html,
        plainText: input.plainText,
        variables: input.variables || extractTemplateVariables(input.html + input.plainText),
        active: input.active ?? true,
        status: input.status ?? "PUBLISHED",
        version: existing.version + 1
      }
    });
  }

  return prisma.notificationTemplate.create({
    data: {
      name: input.name,
      eventName: input.eventName,
      channel: input.channel,
      title: input.title,
      subject: input.subject,
      html: input.html,
      plainText: input.plainText,
      variables: input.variables || extractTemplateVariables(input.html + input.plainText),
      active: input.active ?? true,
      status: input.status ?? "PUBLISHED"
    }
  });
}

export async function syncTemplatesFromSettings(templates: Record<NotificationEventName, NotificationTemplateDraft>) {
  const promises = Object.entries(templates).map(async ([eventName, draft]) => {
    return saveNotificationTemplate({
      name: `${eventName}-email`,
      eventName: eventName as NotificationEventName,
      channel: "email",
      locale: "en",
      title: draft.title,
      subject: draft.subject,
      html: buildTemplateHtml(draft.body),
      plainText: buildTemplatePlainText(draft.body),
      variables: extractTemplateVariables(draft.body),
      active: true,
      status: "PUBLISHED"
    });
  });
  await Promise.all(promises);
}

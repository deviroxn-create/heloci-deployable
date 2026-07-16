import Handlebars from "handlebars";
import { prisma } from "@/lib/prisma/client";
import type { NotificationChannel, NotificationEventName, NotificationPayload } from "./notification.service";

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
  document_uploaded: { title: "Document uploaded", subject: "Document uploaded", body: "A new document was uploaded for {{name}}." },
  application_approved: { title: "Application approved", subject: "Application approved", body: "Your application was approved, {{name}}." },
  application_rejected: { title: "Application update", subject: "Application update", body: "Your application was updated, {{name}}." },
  application_waitlisted: { title: "Waitlist notification", subject: "Application waitlisted", body: "Your application has been waitlisted, {{name}}. We will notify you if a spot opens up." },
  documents_requested: { title: "Documents requested", subject: "Additional documents needed", body: "Please provide the requested documents to continue your application, {{name}}." },
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
  admin_test: { title: "Notification test", subject: "Notification test", body: "This is a test notification for {{name}}." }
};

export function extractTemplateVariables(template: string) {
  const matches = template.match(/\{\{\s*([\w.]+)\s*\}\}/g) || [];
  const variables = matches.map((match) => match.replace(/\{\{\s*/, "").replace(/\s*\}\}/, ""));
  return Array.from(new Set(variables.filter(Boolean)));
}

export function renderTemplate(template: string, payload: NotificationPayload) {
  try {
    const compiled = Handlebars.compile(template, { noEscape: true });
    return compiled(payload);
  } catch {
    return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
      const value = payload[key as keyof NotificationPayload];
      return value == null ? "" : String(value);
    });
  }
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

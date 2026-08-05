"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { requireOrgRole } from "@/lib/auth/rbac";
import { getOperationOrganizationId, resolveCommunicationScope } from "@/lib/communications/scope.service";
import { extractTemplateVariables, renderTemplate, buildTemplateHtml, buildTemplatePlainText } from "@/lib/notifications/template.service";
import type { NotificationEventName, NotificationChannel } from "@/lib/notifications/notification.service";
import {
  listTemplates,
  countTemplates,
  getTemplateById,
  createOrUpdateTemplate,
  deleteTemplateRecord,
  listFavoriteTemplates,
  listRecentTemplates,
  previewTemplate,
  publishTemplateRecord,
  archiveTemplateRecord
} from "@/lib/communications/template-queries.service";

/**
 * SMART TEMPLATE SYSTEM - Server Actions
 * Phase 1.7 Milestone 5
 * 
 * Unified template management for all communication channels
 * Reuses NotificationTemplate infrastructure
 */

export type TemplateCategory = 
  | "general_message"
  | "email_reply"
  | "announcement"
  | "document_request"
  | "decision_approval"
  | "decision_rejection"
  | "waitlist_notification"
  | "reminder"
  | "staff_note"
  | "internal_message"
  | "system_message"
  | "custom";

export interface SmartTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  subject?: string;
  body: string;
  variables: string[];
  eventName: string;
  channel: string;
  status: "DRAFT" | "PUBLISHED";
  isFavorite?: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateSearchResult {
  templates: SmartTemplate[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Map template categories to notification event names
 */
function getCategoryEventNames(category: TemplateCategory): NotificationEventName[] {
  const mapping: Record<TemplateCategory, NotificationEventName[]> = {
    "general_message": ["admin_action"],
    "email_reply": ["admin_action"],
    "announcement": ["admin_action"],
    "document_request": ["documents_requested"],
    "decision_approval": ["application_approved"],
    "decision_rejection": ["application_rejected"],
    "waitlist_notification": ["application_waitlisted"],
    "reminder": ["admin_action"],
    "staff_note": ["admin_action"],
    "internal_message": ["admin_action"],
    "system_message": ["admin_action"],
    "custom": ["admin_action"]
  };
  return mapping[category] || ["admin_action"];
}

/**
 * Get category metadata for UI display
 */
export async function getTemplateCategoriesAction() {
  const categories: Array<{
    category: TemplateCategory;
    label: string;
    icon: string;
    description: string;
  }> = [
    {
      category: "general_message",
      label: "General Message",
      icon: "💬",
      description: "Generic messages for any purpose"
    },
    {
      category: "email_reply",
      label: "Email Reply",
      icon: "📧",
      description: "Email responses with subject and body"
    },
    {
      category: "announcement",
      label: "Announcement",
      icon: "📢",
      description: "Organization-wide announcements"
    },
    {
      category: "document_request",
      label: "Document Request",
      icon: "📋",
      description: "Request documents from applicants"
    },
    {
      category: "decision_approval",
      label: "Approval Decision",
      icon: "✅",
      description: "Notify approval decisions"
    },
    {
      category: "decision_rejection",
      label: "Rejection Decision",
      icon: "❌",
      description: "Notify rejection decisions"
    },
    {
      category: "waitlist_notification",
      label: "Waitlist Notification",
      icon: "⏳",
      description: "Waitlist status updates"
    },
    {
      category: "reminder",
      label: "Reminder",
      icon: "🔔",
      description: "Follow-up reminders"
    },
    {
      category: "staff_note",
      label: "Staff Note",
      icon: "📝",
      description: "Internal staff communication"
    },
    {
      category: "internal_message",
      label: "Internal Message",
      icon: "🔒",
      description: "Private internal messages"
    }
  ];

  return categories;
}

/**
 * Search templates with full-text search and filtering
 */
export async function searchTemplatesAction(
  query: string = "",
  category?: TemplateCategory,
  status: "DRAFT" | "PUBLISHED" | "ALL" = "PUBLISHED",
  page: number = 1,
  pageSize: number = 20,
  selectedOrgId?: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);

  const skip = (page - 1) * pageSize;

  // Build filter
  const where: any = {
    active: true,
    channel: { in: ["email", "internal_message"] }
  };

  if (status !== "ALL") {
    where.status = status;
  }

  if (category) {
    const eventNames = getCategoryEventNames(category);
    where.eventName = { in: eventNames };
  }

  if (query.trim()) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { plainText: { contains: query, mode: "insensitive" } },
      { subject: { contains: query, mode: "insensitive" } },
      { title: { contains: query, mode: "insensitive" } }
    ];
  }

  // Execute search
  const [templates, total] = await Promise.all([
    listTemplates(where, skip, pageSize),
    countTemplates(where)
  ]);

  // Map category from event name
  const mapCategory = (eventName: string): TemplateCategory => {
    if (eventName.includes("document")) return "document_request";
    if (eventName.includes("approved")) return "decision_approval";
    if (eventName.includes("rejected")) return "decision_rejection";
    if (eventName.includes("waitlist")) return "waitlist_notification";
    return "general_message";
  };

  return {
    templates: templates.map(t => ({
      id: t.id,
      name: t.name,
      category: mapCategory(t.eventName),
      subject: t.subject,
      body: t.plainText || "",
      variables: (t.variables as string[]) || [],
      eventName: t.eventName,
      channel: t.channel,
      status: t.status as "DRAFT" | "PUBLISHED",
      createdBy: "system",
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    })),
    total,
    page,
    pageSize
  };
}

/**
 * Get single template by ID
 */
export async function getTemplateAction(templateId: string, selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);

  const template = await getTemplateById(templateId);

  if (!template) throw new Error("Template not found");

  const mapCategory = (eventName: string): TemplateCategory => {
    if (eventName.includes("document")) return "document_request";
    if (eventName.includes("approved")) return "decision_approval";
    if (eventName.includes("rejected")) return "decision_rejection";
    if (eventName.includes("waitlist")) return "waitlist_notification";
    return "general_message";
  };

  return {
    id: template.id,
    name: template.name,
    category: mapCategory(template.eventName),
    subject: template.subject,
    body: template.plainText || "",
    variables: (template.variables as string[]) || [],
    eventName: template.eventName,
    channel: template.channel,
    status: template.status as "DRAFT" | "PUBLISHED",
    createdBy: "system",
    createdAt: template.createdAt,
    updatedAt: template.updatedAt
  };
}

/**
 * Create or update a template
 */
export async function saveTemplateAction(input: {
  id?: string;
  name: string;
  subject?: string;
  body: string;
  category: TemplateCategory;
  eventName?: NotificationEventName;
  channel?: NotificationChannel;
  status?: "DRAFT" | "PUBLISHED";
}, selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const operationOrganizationId = getOperationOrganizationId(scope);

  if (operationOrganizationId) {
    await requireOrgRole(user.id, operationOrganizationId, ["org_admin"]);
  }

  const variables = extractTemplateVariables(input.body + (input.subject || ""));
  const channel = input.channel || "email";
  const status = input.status || "DRAFT";

  // Default event name based on category
  const eventName = input.eventName || getCategoryEventNames(input.category)[0];

  if (input.id) {
    // Update existing
    return createOrUpdateTemplate(input.id, {
      name: input.name,
      subject: input.subject,
      body: input.body,
      eventName,
      channel,
      status,
      variables,
      html: buildTemplateHtml(input.body)
    });
  }

  // Create new
  return createOrUpdateTemplate(undefined, {
    name: input.name,
    subject: input.subject,
    body: input.body,
    eventName,
    channel,
    status,
    variables,
    html: buildTemplateHtml(input.body)
  });
}

/**
 * Delete template (soft delete via active flag)
 */
export async function deleteTemplateAction(templateId: string, selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const operationOrganizationId = getOperationOrganizationId(scope);

  if (operationOrganizationId) {
    await requireOrgRole(user.id, operationOrganizationId, ["org_admin"]);
  }

  return deleteTemplateRecord(templateId);
}

/**
 * Get template favorites (stub - would use user preferences)
 */
export async function getFavoriteTemplatesAction(selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);

  // TODO: Implement user preferences for favorites
  // For now, return most recently used templates
  const templates = await listFavoriteTemplates(5);

  const mapCategory = (eventName: string): TemplateCategory => {
    if (eventName.includes("document")) return "document_request";
    if (eventName.includes("approved")) return "decision_approval";
    if (eventName.includes("rejected")) return "decision_rejection";
    if (eventName.includes("waitlist")) return "waitlist_notification";
    return "general_message";
  };

  return templates.map(t => ({
    id: t.id,
    name: t.name,
    category: mapCategory(t.eventName),
    subject: t.subject,
    body: t.plainText || "",
    variables: (t.variables as string[]) || [],
    eventName: t.eventName,
    channel: t.channel,
    status: t.status as "DRAFT" | "PUBLISHED",
    createdBy: "system",
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    isFavorite: true
  }));
}

/**
 * Get recently used templates (stub - would track usage)
 */
export async function getRecentTemplatesAction(selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);

  // TODO: Implement usage tracking
  // For now, return most recent templates
  const templates = await listRecentTemplates(10);

  const mapCategory = (eventName: string): TemplateCategory => {
    if (eventName.includes("document")) return "document_request";
    if (eventName.includes("approved")) return "decision_approval";
    if (eventName.includes("rejected")) return "decision_rejection";
    if (eventName.includes("waitlist")) return "waitlist_notification";
    return "general_message";
  };

  return templates.map(t => ({
    id: t.id,
    name: t.name,
    category: mapCategory(t.eventName),
    subject: t.subject,
    body: t.plainText || "",
    variables: (t.variables as string[]) || [],
    eventName: t.eventName,
    channel: t.channel,
    status: t.status as "DRAFT" | "PUBLISHED",
    createdBy: "system",
    createdAt: t.createdAt,
    updatedAt: t.updatedAt
  }));
}

/**
 * Get template suggestions based on context
 */
export async function getSuggestedTemplatesAction(context: {
  applicationStatus?: string;
  communicationMode?: string;
  userRole?: string;
  programName?: string;
}, selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);

  let category: TemplateCategory | undefined;

  // Map context to category
  if (context.applicationStatus === "approved") {
    category = "decision_approval";
  } else if (context.applicationStatus === "rejected") {
    category = "decision_rejection";
  } else if (context.applicationStatus === "waitlisted") {
    category = "waitlist_notification";
  } else if (context.communicationMode === "document_request") {
    category = "document_request";
  } else if (context.communicationMode === "announcement") {
    category = "announcement";
  }

  if (!category) {
    return [];
  }

  const result = await searchTemplatesAction("", category, "PUBLISHED", 1, 5, selectedOrgId);
  return result.templates;
}

/**
 * Preview template with variables rendered
 */
export async function previewTemplateAction(
  templateId: string,
  variables: Record<string, string>,
  selectedOrgId?: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);

  const template = await previewTemplate(templateId);

  if (!template) throw new Error("Template not found");

  const body = renderTemplate(template.plainText || "", variables as any);
  const subject = template.subject ? renderTemplate(template.subject, variables as any) : "";

  return {
    subject,
    body,
    variables: (template.variables as string[]) || []
  };
}

/**
 * Publish template (change status from DRAFT to PUBLISHED)
 */
export async function publishTemplateAction(templateId: string, selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const operationOrganizationId = getOperationOrganizationId(scope);

  if (operationOrganizationId) {
    await requireOrgRole(user.id, operationOrganizationId, ["org_admin"]);
  }

  return publishTemplateRecord(templateId);
}

/**
 * Archive template (change status to DRAFT without deleting)
 */
export async function archiveTemplateAction(templateId: string, selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const operationOrganizationId = getOperationOrganizationId(scope);

  if (operationOrganizationId) {
    await requireOrgRole(user.id, operationOrganizationId, ["org_admin"]);
  }

  return archiveTemplateRecord(templateId);
}

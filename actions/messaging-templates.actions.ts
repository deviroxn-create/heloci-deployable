"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { requireOrgRole } from "@/lib/auth/rbac";
import { getOperationOrganizationId, resolveCommunicationScope } from "@/lib/communications/scope.service";
import {
  listMessageTemplates,
  countMessageTemplates,
  getMessageTemplateById,
  searchRecipients,
  searchRecipientsByType,
  getAllRecipientTypes,
  getMessageTemplateCategories,
  getRecipientSearchResult
} from "@/lib/communications/message-template.service";

/**
 * MESSAGE TEMPLATES - Communication Center Templates
 * Reuses NotificationTemplate system
 * Categories: General, Approval, Rejection, Waitlist, Missing Documents, Appointment, Reminder, Custom
 */

export type MessageTemplateCategory = "general" | "approval" | "rejection" | "waitlist" | "missing_documents" | "appointment" | "reminder" | "custom";

export interface MessageTemplate {
  id: string;
  name: string;
  category: MessageTemplateCategory;
  subject: string;
  body: string;
  variables: string[];
  createdBy: string;
  createdAt: Date;
}

/**
 * Map category to notification template types
 */
function getCategoryEventNames(category: MessageTemplateCategory): string[] {
  const mapping: Record<MessageTemplateCategory, string[]> = {
    "general": ["admin_action"],
    "approval": ["application_approved"],
    "rejection": ["application_rejected"],
    "waitlist": ["application_waitlisted"],
    "missing_documents": ["documents_requested"],
    "appointment": ["admin_action"],
    "reminder": ["admin_action"],
    "custom": ["admin_action"]
  };
  return mapping[category] || ["admin_action"];
}

/**
 * Get message templates by category
 * Reuses NotificationTemplate
 */
export async function getMessageTemplatesAction(category: MessageTemplateCategory, selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);

  const eventNames = getCategoryEventNames(category);

  // Get published templates that match category
  const templates = await listMessageTemplates(eventNames);

  return templates.map(t => ({
    id: t.id,
    name: t.name,
    subject: t.subject,
    body: t.plainText || "",
    variables: (t.variables as string[]) || [],
    category,
    createdAt: t.createdAt
  }));
}

/**
 * Get all available message template categories
 */
export async function getMessageTemplateCategoriesAction(selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);

  return getMessageTemplateCategories();
}

/**
 * Get single template with variables extracted
 */
export async function getMessageTemplateAction(templateId: string, selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);

  return getMessageTemplateById(templateId);
}

/**
 * RECIPIENT PICKER - Search for users/staff to message
 */
export async function searchRecipientsAction(query: string, type: "applicant" | "staff" | "admin" = "applicant", selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const operationOrganizationId = getOperationOrganizationId(scope);

  if (operationOrganizationId) {
    await requireOrgRole(user.id, operationOrganizationId, ["org_admin", "case_worker"]);
  }

  const orgId = getOperationOrganizationId(scope);
  if (!orgId) throw new Error("Organization context required");

  if (type === "applicant") {
    return searchRecipients(query, orgId, "applicant");
  }

  if (type === "staff") {
    return searchRecipientsByType(query, orgId, "staff");
  }

  if (type === "admin") {
    return searchRecipientsByType(query, orgId, "admin");
  }

  return [];
}

/**
 * Search recipients across all types (applicant, staff, admin)
 */
export async function searchAllRecipientsAction(query: string, selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);

  const [applicants, staff, admins] = await Promise.all([
    searchRecipientsAction(query, "applicant", selectedOrgId),
    searchRecipientsAction(query, "staff", selectedOrgId),
    searchRecipientsAction(query, "admin", selectedOrgId)
  ]);

  return {
    applicants,
    staff,
    admins
  };
}

/**
 * Extract template variables for UI previews
 */
export function extractTemplateVariables(text: string): string[] {
  const matches = text.match(/\{\{([\w_]+)\}\}/g) || [];
  return Array.from(new Set(matches.map(m => m.replace(/\{\{|\}\}/g, ""))));
}

/**
 * Render template with sample data for preview
 */
export function renderTemplatePreview(template: string, category: MessageTemplateCategory): string {
  const sampleData: Record<MessageTemplateCategory, Record<string, string>> = {
    "general": {
      "applicantName": "John Smith",
      "programName": "First-Time Homebuyer Program",
      "applicationId": "app-123"
    },
    "approval": {
      "applicantName": "John Smith",
      "programName": "First-Time Homebuyer Program",
      "applicationId": "app-123",
      "nextSteps": "You will receive next steps via email"
    },
    "rejection": {
      "applicantName": "John Smith",
      "programName": "First-Time Homebuyer Program",
      "reason": "Income exceeds program limits",
      "reapplyDate": "January 1, 2025"
    },
    "waitlist": {
      "applicantName": "John Smith",
      "programName": "First-Time Homebuyer Program",
      "position": "15"
    },
    "missing_documents": {
      "applicantName": "John Smith",
      "documentTypes": "Pay stubs and tax returns",
      "dueDate": "December 31, 2024"
    },
    "appointment": {
      "applicantName": "John Smith",
      "appointmentDate": "December 20, 2024",
      "appointmentTime": "2:00 PM",
      "location": "123 Main St"
    },
    "reminder": {
      "applicantName": "John Smith",
      "action": "complete your application"
    },
    "custom": {}
  };

  const data = sampleData[category] || {};
  return template.replace(/\{\{([\w_]+)\}\}/g, (_match, key) => data[key] || `{{${key}}}`);
}

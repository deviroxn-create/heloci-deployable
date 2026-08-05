"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { authorizeCommunicationRead, authorizeCommunicationWrite } from "@/lib/auth/communication-authorization";
import { resolveCommunicationScope, getOperationOrganizationId } from "@/lib/communications/scope.service";
import {
  getInboxWidgetStats,
  getEmailDeliveryRate,
  getFailedEmails,
  getAverageReplyTime,
  getOpenConversations,
  getSenderIdentityStats,
  getSenderPerformanceBreakdown
} from "@/lib/communications/dashboard-widgets.service";
import { sendCaseMessage, getOrCreateConversation, MessageType } from "@/lib/communications/case-communication.service";
import { notificationService } from "@/lib/notifications/notification.service";
import {
  createInternalMessage,
  getApplicationForCompose,
  getSuggestedTemplateForApplicationStatus,
  createInternalMessageForRecipient
} from "@/lib/communications/message-template.service";

/**
 * Get inbox dashboard widgets
 */
export async function getInboxWidgetsAction(selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const organizationId = getOperationOrganizationId(scope);

  if (!organizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  await authorizeCommunicationRead(organizationId, ["org_admin", "case_worker", "reviewer"]);

  return getInboxWidgetStats(user.id, scope);
}

/**
 * Get email delivery rate widget
 */
export async function getEmailDeliveryRateAction(selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const organizationId = getOperationOrganizationId(scope);

  if (!organizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  await authorizeCommunicationRead(organizationId, ["org_admin"]);

  return getEmailDeliveryRate(scope, user.id);
}

/**
 * Get failed emails for widget
 */
export async function getFailedEmailsAction(selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const organizationId = getOperationOrganizationId(scope);

  if (!organizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  await authorizeCommunicationRead(organizationId, ["org_admin", "case_worker"]);

  return getFailedEmails(scope, user.id);
}

/**
 * Get average reply time
 */
export async function getAverageReplyTimeAction(selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const organizationId = getOperationOrganizationId(scope);

  if (!organizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  await authorizeCommunicationRead(organizationId, ["org_admin", "case_worker"]);

  return getAverageReplyTime(scope, user.id);
}

/**
 * Get open conversations count
 */
export async function getOpenConversationsAction(selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const organizationId = getOperationOrganizationId(scope);

  if (!organizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  await authorizeCommunicationRead(organizationId, ["org_admin", "case_worker", "reviewer"]);

  return getOpenConversations(scope, user.id);
}

/**
 * QUICK ACTION: Send email to applicant
 * Triggered from dashboard card
 */
export async function quickSendEmailAction(input: {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  body: string;
  templateId?: string;
  selectedOrgId?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, input.selectedOrgId);

  // Use email service to send
  const response = await fetch("http://localhost:3000/api/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organizationId: getOperationOrganizationId(scope),
      recipientEmail: input.recipientEmail,
      subject: input.subject,
      body: input.body,
      templateId: input.templateId
    })
  });

  if (!response.ok) throw new Error("Failed to send email");
  return response.json();
}

/**
 * QUICK ACTION: Send internal message to staff
 * Triggered from dashboard card
 */
export async function quickSendInternalMessageAction(input: {
  recipientUserId: string;
  subject: string;
  body: string;
  selectedOrgId?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, input.selectedOrgId);

  // Create a direct message (store in Message model for staff-to-staff)
  const message = await createInternalMessage({
    senderId: user.id,
    recipientUserId: input.recipientUserId,
    subject: input.subject,
    body: input.body
  });

  await createInternalMessageForRecipient({
    recipientUserId: input.recipientUserId,
    senderName: user.name || user.email,
    body: input.body
  });

  return { success: true, messageId: message.id };
}

/**
 * QUICK ACTION: Request documents from applicant
 * Triggered from dashboard card
 */
export async function quickRequestDocumentsAction(input: {
  applicationId: string;
  documentTypes: string[];
  notes?: string;
  dueDate?: Date;
  selectedOrgId?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, input.selectedOrgId);
  const organizationId = getOperationOrganizationId(scope);

  if (!organizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  await authorizeCommunicationWrite(organizationId, ["org_admin", "reviewer", "case_worker"]);

  // Use communication service to create document requests
  const { requestDocumentsInCase } = await import("@/lib/communications/case-communication.service");

  return requestDocumentsInCase(
    input.applicationId,
    user.id,
    scope,
    input.documentTypes,
    {
      dueDate: input.dueDate,
      notes: input.notes,
      priority: "high"
    }
  );
}

/**
 * QUICK ACTION: Open inbox
 * Navigate to /staff/messages or /admin/messages
 */
export async function quickOpenInboxAction() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return { redirect: user.role === "STAFF" ? "/staff/messages" : "/admin/messages" };
}

/**
 * QUICK ACTION: View drafts
 * Navigate to email workspace
 */
export async function quickViewDraftsAction() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return { redirect: user.role === "STAFF" ? "/staff/email" : "/admin/email" };
}

/**
 * QUICK ACTION: Prefill email compose from case
 * Called when clicking "Send Email" from case conversation
 */
export async function getEmailComposePreFillAction(input: {
  applicationId: string;
  useTemplate?: boolean;
  selectedOrgId?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, input.selectedOrgId);

  // Get application details
  const application = await getApplicationForCompose(input.applicationId);

  if (!application) throw new Error("Application not found");
  
  // Verify access based on scope
  const operationOrganizationId = getOperationOrganizationId(scope);
  if (operationOrganizationId && operationOrganizationId !== application.program.organizationId) {
    throw new Error("UNAUTHORIZED");
  }

  // Get suggested template
  let templateId = undefined;
  if (input.useTemplate && application.status) {
    const template = await getSuggestedTemplateForApplicationStatus(application.status);
    templateId = template?.id;
  }

  return {
    recipientEmail: application.user.email,
    recipientName: application.user.name,
    applicationId: application.id,
    applicationStatus: application.status,
    programName: application.program.name,
    subject: `Re: ${application.program.name} Application`,
    suggestedTemplateId: templateId,
    suggestedTemplate: templateId ? "Use template" : null
  };
}

/**
 * Helper: Map application status to notification event
 */
function getEventNameForStatus(status: string): string[] {
  const eventMap: Record<string, string[]> = {
    "approved": ["application_approved"],
    "rejected": ["application_rejected"],
    "waitlisted": ["application_waitlisted"],
    "more_info_requested": ["documents_requested"],
    "under_review": ["application_under_review"],
    "pending": []
  };
  return eventMap[status] || [];
}

/**
 * COMBINED ACTION: Send email AND internal message
 * "Also send as internal message" checkbox in compose
 */
export async function sendEmailWithInternalMessageAction(input: {
  applicationId: string;
  recipientEmail: string;
  recipientName?: string;
  staffMemberId?: string; // Who to CC in internal message
  subject: string;
  body: string;
  alsoInternalMessage: boolean;
  internalMessageRecipient?: string;
  selectedOrgId?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, input.selectedOrgId);
  const organizationId = getOperationOrganizationId(scope);

  if (!organizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  await authorizeCommunicationWrite(organizationId, ["org_admin", "reviewer", "case_worker"]);

  // Step 1: Send email
  const emailResult = await quickSendEmailAction({
    recipientEmail: input.recipientEmail,
    recipientName: input.recipientName,
    subject: input.subject,
    body: input.body,
    selectedOrgId: input.selectedOrgId
  });

  if (!emailResult.success) throw new Error("Failed to send email");

  // Step 2: Create internal message if enabled
  if (input.alsoInternalMessage && input.internalMessageRecipient) {
    await quickSendInternalMessageAction({
      recipientUserId: input.internalMessageRecipient,
      subject: `Internal: ${input.subject}`,
      body: `Email sent to applicant:\n\n${input.body}`,
      selectedOrgId: input.selectedOrgId
    });
  }

  // Step 3: Post to case conversation for audit
  await sendCaseMessage(
    input.applicationId,
    user.id,
    scope,
    `📧 Email sent to ${input.recipientEmail}:\n\n**Subject:** ${input.subject}\n\n${input.body}`,
    { messageType: MessageType.NORMAL }
  );

  // One audit log via ApplicationEvent (already done in sendCaseMessage)
  // One transaction (all in one function)

  return {
    success: true,
    emailSent: emailResult.success,
    internalMessageSent: input.alsoInternalMessage,
    conversationUpdated: true
  };
}

/**
 * Get sender identity statistics for dashboard
 */
export async function getSenderIdentityStatsAction(selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const organizationId = getOperationOrganizationId(scope);

  if (!organizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  await authorizeCommunicationRead(organizationId, ["org_admin", "case_worker"]);

  return getSenderIdentityStats(scope, user.id);
}

/**
 * Get sender performance breakdown
 */
export async function getSenderPerformanceBreakdownAction(senderId?: string, selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const organizationId = getOperationOrganizationId(scope);

  if (!organizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  await authorizeCommunicationRead(organizationId, ["org_admin"]);

  return getSenderPerformanceBreakdown(scope, user.id, senderId);
}

/**
 * Get top senders by volume
 */
export async function getTopSendersAction(limit: number = 5, selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const scope = resolveCommunicationScope(user, selectedOrgId);

  const stats = await getSenderIdentityStats(scope, user.id);
  return stats.topSenders.slice(0, limit);
}

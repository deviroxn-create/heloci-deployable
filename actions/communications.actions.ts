"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { authorizeCommunicationRead } from "@/lib/auth/communication-authorization";
import { getOperationOrganizationId, resolveCommunicationScope } from "@/lib/communications/scope.service";
import { getStaffConversationList, getUnreadCount, searchMessages } from "@/lib/communications/case-communication.service";

/**
 * Server action to fetch staff conversation list for inbox
 * Platform Admins can view inbox after organization selection
 */
export async function getStaffInboxAction(filters?: {
  search?: string;
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
}, selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const organizationId = getOperationOrganizationId(scope);

  if (!organizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  await authorizeCommunicationRead(organizationId, ["org_admin", "reviewer", "viewer", "case_worker"]);
  
  return getStaffConversationList(user.id, scope, filters);
}

/**
 * Server action to get unread message count
 * Platform Admins can view counts after organization selection
 */
export async function getUnreadCountAction(selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const organizationId = getOperationOrganizationId(scope);

  if (!organizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  await authorizeCommunicationRead(organizationId, ["org_admin", "reviewer", "viewer", "case_worker"]);
  
  return getUnreadCount(user.id, scope);
}

/**
 * Server action to search messages
 * Platform Admins can search after organization selection
 */
export async function searchMessagesAction(query: string, filters?: {
  applicationId?: string;
  page?: number;
  pageSize?: number;
}, selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const organizationId = getOperationOrganizationId(scope);

  if (!organizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  await authorizeCommunicationRead(organizationId, ["org_admin", "reviewer", "viewer", "case_worker"]);
  
  return searchMessages(user.id, scope, query);
}

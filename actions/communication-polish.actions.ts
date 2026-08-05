"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { authorizeCommunicationRead } from "@/lib/auth/communication-authorization";
import { getOperationOrganizationId, resolveCommunicationScope } from "@/lib/communications/scope.service";
import { getUnifiedTimeline } from "@/lib/communications/unified-timeline.service";
import { getCommunicationMetrics } from "@/lib/communications/communication-metrics.service";
import { searchCommunications, getSearchSuggestions } from "@/lib/communications/unified-search.service";

/**
 * PHASE 1.6 POLISH - Server Actions
 * Unified timeline, metrics, and search actions
 * Platform Admins can view after organization selection
 */

/**
 * Get unified timeline for application
 */
export async function getUnifiedTimelineAction(
  applicationId: string,
  page: number = 1,
  selectedOrgId?: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const organizationId = getOperationOrganizationId(scope);

  if (!organizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  await authorizeCommunicationRead(organizationId);

  return getUnifiedTimeline(applicationId, user.id, scope, {
    page,
    pageSize: 50
  });
}

/**
 * Get communication metrics dashboard
 */
export async function getCommunicationMetricsAction(
  period: "today" | "week" | "month" = "today",
  selectedOrgId?: string
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const organizationId = getOperationOrganizationId(scope);

  if (!organizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  await authorizeCommunicationRead(organizationId);

  return getCommunicationMetrics(scope, user.id, period);
}

/**
 * Search all communications
 */
export async function searchCommunicationsAction(query: string, selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const organizationId = getOperationOrganizationId(scope);

  if (!organizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  await authorizeCommunicationRead(organizationId, ["org_admin", "case_worker", "reviewer"]);

  if (query.length < 2) {
    return {
      messages: [],
      emails: [],
      applications: [],
      staff: [],
      programs: [],
      documentRequests: [],
      totalCount: 0,
    };
  }

  return searchCommunications(query, user.id, scope, {
    limit: 10
  });
}

/**
 * Get search suggestions as user types
 */
export async function getSearchSuggestionsAction(query: string, selectedOrgId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const scope = resolveCommunicationScope(user, selectedOrgId);
  const organizationId = getOperationOrganizationId(scope);

  if (!organizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  await authorizeCommunicationRead(organizationId, ["org_admin", "case_worker", "reviewer"]);

  return getSearchSuggestions(query, user.id, scope, 5);
}

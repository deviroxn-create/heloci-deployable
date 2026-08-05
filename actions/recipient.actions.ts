"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { isPlatformSuperAdmin } from "@/lib/auth/rbac";
import {
  findOrganizationMembersForSearch,
  findApplicantsForSearch,
  findDepartmentsForSearch,
  countDepartmentMembers,
  getRecentRecipientLogs,
  findUsersByEmails,
  findOrgMembersForSuggestions,
  findOrganizationUserByEmail,
  getOrganizationMembership,
  getDepartmentDetails,
  getDepartmentMembers as getDepartmentMemberRecords,
  getRecentRecipientUsers,
  getRecentRecipientLogs as getRecipientLogs
} from "@/lib/communications/recipient-search.service";
import {
  getAvailableOrganizations,
  getOrganizationContext as getOrganizationContextRecord,
} from "@/lib/organizations/organization-context";
import type {
  RecipientCard,
  RecipientGroup,
  RecipientSearchResult,
  RecipientOrgMember,
} from "@/lib/communications/recipient.types";

/**
 * Search recipients across an organization
 * Reuses existing RBAC and organization isolation patterns
 * 
 * Supports searching:
 * - Applicants (users with role APPLICANT)
 * - Staff (organization members)
 * - Admins (org_admin role)
 * - Case Workers
 * - Housing Coordinators
 * - ANY user account in organization
 * - By department, team, role
 * - Favorites and recent contacts
 * 
 * Returns ranked matches across all user types in a single unified result
 */
export async function searchRecipients(
  organizationId: string,
  query: string,
  options?: {
    limit?: number;
    departmentId?: string;
    type?: "applicants" | "staff" | "admins";
    excludeUserId?: string;
  }
): Promise<RecipientSearchResult> {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error("Not authenticated");
  }

  // Verify user has access to this organization
  if (user.role !== "SUPER_ADMIN" || user.organizationId) {
    // Regular user: verify they belong to the org
    const membership = await getOrganizationMembership(organizationId, user.id);

    if (!membership && user.organizationId !== organizationId) {
      throw new Error("Unauthorized access to organization");
    }
  }

  const limit = options?.limit ?? 20;
  const searchTerm = `%${query}%`;

  let users: RecipientCard[] = [];
  let groups: RecipientGroup[] = [];

  // Search across ALL user types in organization when no specific type specified
  // This includes staff, applicants, admins, case workers, coordinators, etc.
  const allOrgMembers = await findOrganizationMembersForSearch(organizationId, query, limit, options?.departmentId, options?.excludeUserId);

  users = allOrgMembers.map((member) =>
    mapRecipientCard(member, organizationId)
  );

  // Also search applicants not in org members
  if (!options?.type || options.type === "applicants") {
    const applicants = await findApplicantsForSearch(organizationId, query, limit, options?.excludeUserId);

    const applicantCards = applicants.map((applicant) => ({
      id: applicant.id,
      email: applicant.email,
      name: applicant.name || "Unknown",
      role: "applicant",
      organizationId,
      department: undefined,
      isRecent: false,
      isFavorite: false,
      status: "offline" as const,
    }));

    // Combine and deduplicate
    const allUsersSet = new Map<string, RecipientCard>();
    users.forEach((u) => allUsersSet.set(u.email, u));
    applicantCards.forEach((a) => {
      if (!allUsersSet.has(a.email)) {
        allUsersSet.set(a.email, a);
      }
    });
    users = Array.from(allUsersSet.values()).slice(0, limit);
  }

  // Search departments as groups
  if (query.length > 0) {
    const departments = await findDepartmentsForSearch(organizationId, query, 5);

    // Count members in each department
    const departmentGroups = await Promise.all(
      departments.map(async (dept) => {
        const memberCount = await countDepartmentMembers(dept.id);

        return {
          id: dept.id,
          name: dept.name,
          type: "department" as const,
          organizationId,
          recipientCount: memberCount,
          isExpanded: false,
        };
      })
    );

    groups = departmentGroups;
  }

  // Get recent recipients (from CommunicationTimelineEntry or NotificationLog)
  const recent = await getRecentRecipients(user.id, organizationId, 5);

  // Get favorites (stored in user metadata or preferences - MVP: empty)
  const favorites: RecipientCard[] = [];

  // Get suggestions based on role and department
  const suggestions = await getRecipientSuggestions(user.id, organizationId, 5);

  return {
    users,
    groups,
    recent,
    favorites,
    suggestions,
  };
}

/**
 * Get department members (expands a department group)
 */
export async function getDepartmentMembers(
  departmentId: string,
  organizationId: string
): Promise<RecipientCard[]> {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error("Not authenticated");
  }

  // Verify department belongs to user's organization
  const dept = await getDepartmentDetails(departmentId);

  if (!dept || dept.organizationId !== organizationId) {
    throw new Error("Department not found or unauthorized");
  }

  const members = await getDepartmentMemberRecords(departmentId, organizationId);

  return members.map((member) => ({
    id: member.id,
    email: member.email,
    name: member.name || "Unknown",
    role: member.jobTitle || "Staff",
    organizationId,
    department: dept.name,
    status: "offline",
  }));
}

/**
 * Get recent recipients (users frequently contacted)
 * Reuses NotificationLog and communication timeline
 */
async function getRecentRecipients(
  userId: string,
  organizationId: string,
  limit: number
): Promise<RecipientCard[]> {
  // Get from NotificationLog where user sent notifications
  const recent = await getRecentRecipientLogs(userId, limit);

  // Map to recipient cards
  const recipientEmails = recent.map((log) => log.recipient).filter((email) => email !== null);

  if (recipientEmails.length === 0) {
    return [];
  }

  const users = await getRecentRecipientUsers(recipientEmails as string[]);

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name || "Unknown",
    role: user.role === "STAFF" ? "staff" : "applicant",
    organizationId,
    isRecent: true,
    status: "offline",
    lastContactedAt: recent.find((r) => r.recipient === user.email)?.createdAt,
  }));
}

/**
 * Get recipient suggestions
 * Shows case workers, reviewers, admins, and frequently contacted
 */
async function getRecipientSuggestions(
  userId: string,
  organizationId: string,
  limit: number
): Promise<RecipientCard[]> {
  // Get org admins and case workers
  const members = await findOrgMembersForSuggestions(organizationId, userId, limit);

  return members.map((member) => mapRecipientCard(member, organizationId));
}

/**
 * Helper: Map OrganizationMember to RecipientCard
 */
function mapRecipientCard(
  member: RecipientOrgMember & { user: { department?: any } },
  organizationId: string
): RecipientCard {
  return {
    id: member.userId,
    email: member.user.email,
    name: member.user.name || "Unknown",
    role: member.role,
    organizationId,
    department: member.user.department?.name,
    status: "offline",
    isFavorite: false,
    isRecent: false,
  };
}

/**
 * Get all organizations for Super Admin
 * Allows Super Admin to search across organizations
 */
export async function getAllOrganizationsForSearch(): Promise<
  Array<{ id: string; name: string }>
> {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error("Not authenticated");
  }

  const isSuperAdmin = await isPlatformSuperAdmin(user.id);
  if (!isSuperAdmin) {
    throw new Error("Only Super Admin can search all organizations");
  }

  const organizations = await getAvailableOrganizations();
  return organizations.map((org) => ({ id: org.id, name: org.name }));
}

/**
 * Get organization context for recipient display
 */
export async function getOrganizationContextById(
  organizationId: string
): Promise<{ id: string; name: string }> {
  const org = await getOrganizationContextRecord(organizationId);

  if (!org) {
    throw new Error("Organization not found");
  }

  return org;
}

/**
 * Validate recipients before sending
 * Checks for duplicates, org mismatches, invalid emails
 */
export async function validateRecipients(
  recipients: Array<{ id: string; email: string; organizationId: string }>,
  organizationId: string
): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenEmails = new Set<string>();

  for (const recipient of recipients) {
    // Check for duplicates
    if (seenEmails.has(recipient.email)) {
      warnings.push(`Duplicate recipient: ${recipient.email}`);
    }
    seenEmails.add(recipient.email);

    // Check org mismatch
    if (recipient.organizationId !== organizationId) {
      errors.push(
        `Organization mismatch for ${recipient.email}. Expected ${organizationId}, got ${recipient.organizationId}`
      );
    }

    // Check if user exists
    const user = await findOrganizationUserByEmail(recipient.email);

    if (!user) {
      errors.push(`User not found: ${recipient.email}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

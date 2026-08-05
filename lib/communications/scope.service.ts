/**
 * COMMUNICATION SCOPE RESOLVER
 * 
 * Centralized helper for resolving communication context.
 * Replaces the incorrect assumption that every user has an organizationId.
 * 
 * Architecture:
 * - Platform Context: role=SUPER_ADMIN, organizationId=null
 *   → Can access and filter across all organizations
 *   → No single organization required
 * 
 * - Organization Context: organizationId != null
 *   → Can only access their own organization
 *   → organizationId is mandatory requirement
 * 
 * Usage:
 *   const scope = resolveCommunicationScope(user, selectedOrgId);
 *   // Use scope in service functions
 *   const data = await getInboxWidgetStats(userId, scope);
 */

import type { User } from "@prisma/client";

export interface CommunicationUserLike {
  id: string;
  role?: string | null;
  organizationId?: string | null;
}

/**
 * Platform Super Admin scope
 * Can view and operate across all organizations
 * organizationId is explicitly null (not an error)
 */
export interface PlatformScope {
  mode: "platform";
  organizationId: null;
  userId: string;
  isPlatform: true;
  canViewAllOrganizations: true;
  canSendAsAnyOrganization: true;
  
  /**
   * Optional organization filter for Platform Super Admin
   * When set: operations are scoped to this organization
   * When null: operations span all organizations
   */
  selectedOrganizationId: string | null;
}

/**
 * Organization scope
 * Can only operate within their own organization
 */
export interface OrganizationScope {
  mode: "organization";
  organizationId: string;
  userId: string;
  isPlatform: false;
  canViewAllOrganizations: false;
  canSendAsAnyOrganization: false;
  selectedOrganizationId: null; // Not used for org context
}

/**
 * Union type for communication scope
 */
export type CommunicationScope = PlatformScope | OrganizationScope;

/**
 * Resolve the communication scope for a user
 * 
 * Rules:
 * 1. If user.role === "SUPER_ADMIN" && user.organizationId === null
 *    → Platform scope (can access all organizations)
 * 2. If user.organizationId !== null
 *    → Organization scope (limited to own organization)
 * 3. Otherwise
 *    → Error (invalid user state)
 * 
 * @param user The authenticated user
 * @param selectedOrgId Optional organization filter for platform super admin
 * @returns CommunicationScope for this user
 * @throws Error if user state is invalid
 */
export function normalizeCommunicationScope(
  userOrOrganizationId: CommunicationUserLike | User | string | null | undefined,
  userId?: string,
  selectedOrgId?: string | null
): CommunicationScope {
  if (typeof userOrOrganizationId === "string") {
    return {
      mode: "organization",
      organizationId: userOrOrganizationId,
      userId: userId || "unknown",
      isPlatform: false,
      canViewAllOrganizations: false,
      canSendAsAnyOrganization: false,
      selectedOrganizationId: null,
    };
  }

  const user = userOrOrganizationId;
  if (!user?.id) {
    throw new Error("UNAUTHORIZED: User not authenticated");
  }

  const normalizedRole = String(user.role ?? "").toUpperCase();

  // Platform Super Admin (role=SUPER_ADMIN, organizationId=null)
  // This is VALID. Not an error. Platform admins operate above organizations.
  if (normalizedRole === "SUPER_ADMIN" && user.organizationId === null) {
    return {
      mode: "platform",
      organizationId: null,
      userId: user.id,
      isPlatform: true,
      canViewAllOrganizations: true,
      canSendAsAnyOrganization: true,
      selectedOrganizationId: selectedOrgId || null
    };
  }

  // Organization-scoped user (organizationId is set)
  // These users can only access their own organization
  if (user.organizationId) {
    return {
      mode: "organization",
      organizationId: user.organizationId,
      userId: user.id,
      isPlatform: false,
      canViewAllOrganizations: false,
      canSendAsAnyOrganization: false,
      selectedOrganizationId: null
    };
  }

  // User is authenticated but not SUPER_ADMIN and has no organizationId
  // This is an invalid state - should not happen in normal flows
  throw new Error(
    "UNAUTHORIZED: Invalid user state (not SUPER_ADMIN and no organizationId)"
  );
}

export function resolveCommunicationScope(
  user: CommunicationUserLike | User | string | null | undefined,
  selectedOrgId?: string | null
): CommunicationScope {
  return normalizeCommunicationScope(user, undefined, selectedOrgId);
}

/**
 * Get the effective organization ID for an operation
 * 
 * For Platform scope with selectedOrganizationId: returns the selected org
 * For Platform scope without selection: returns null (global operation)
 * For Organization scope: returns the scope's organizationId
 * 
 * @param scope The communication scope
 * @returns organizationId or null
 */
export function getEffectiveOrganizationId(
  scope: CommunicationScope
): string | null {
  if (scope.mode === "platform") {
    return scope.selectedOrganizationId || null;
  }
  return scope.organizationId;
}

/**
 * Get the organization ID that should be used for RBAC and service operations.
 *
 * For platform scopes, this uses the selected organization when present so
 * that platform admins operate against the same organization context that the
 * UI and API route already selected.
 */
export function getOperationOrganizationId(scope: CommunicationScope): string | null {
  return getEffectiveOrganizationId(scope);
}

/**
 * Check if scope has an organization context (either direct or filtered)
 * 
 * @param scope The communication scope
 * @returns true if organizationId is known
 */
export function hasScopedOrganization(scope: CommunicationScope): boolean {
  if (scope.mode === "organization") {
    return true;
  }
  return scope.selectedOrganizationId !== null;
}

/**
 * Verify that a scope can access a specific organization
 * 
 * Platform Super Admin can access any organization
 * Organization users can only access their own
 * 
 * @param scope The communication scope
 * @param organizationId The organization to access
 * @returns true if access is allowed
 */
export function canAccessOrganization(
  scope: CommunicationScope,
  organizationId: string
): boolean {
  if (scope.isPlatform) {
    return true; // Platform Super Admin can access any organization
  }
  return scope.organizationId === organizationId;
}

/**
 * Build a WHERE clause filter for Prisma queries based on scope
 * 
 * Usage:
 *   const where = getScopeFilter(scope, "organizationId");
 *   const conversations = await prisma.conversation.findMany({ where });
 * 
 * @param scope The communication scope
 * @param organizationField The field name in the model (e.g., "organizationId", "program.organizationId")
 * @returns Prisma WHERE clause
 */
export function getScopeFilter(
  scope: CommunicationScope,
  organizationField: string = "organizationId"
): any {
  // Organization scope: filter by their organization
  if (scope.mode === "organization") {
    const parts = organizationField.split(".");
    const filter: Record<string, unknown> = {};
    let current: Record<string, unknown> = filter;

    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = {};
      current = current[parts[i]] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = scope.organizationId;
    return filter;
  }

  // Platform scope with selected organization
  if (scope.selectedOrganizationId) {
    const parts = organizationField.split(".");
    const filter: Record<string, unknown> = {};
    let current: Record<string, unknown> = filter;

    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = {};
      current = current[parts[i]] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = scope.selectedOrganizationId;
    return filter;
  }

  // Platform scope without selection: no filter (access all organizations)
  return {};
}

/**
 * Filter an array of items by scope
 * Used when data is already loaded and needs scope-based filtering
 * 
 * @param items The items to filter
 * @param scope The communication scope
 * @param organizationIdGetter Function to get organizationId from item
 * @returns Filtered items
 */
export function filterByScope<T>(
  items: T[],
  scope: CommunicationScope,
  organizationIdGetter: (item: T) => string
): T[] {
  // Organization scope: filter by their organization
  if (scope.mode === "organization") {
    return items.filter(
      (item) => organizationIdGetter(item) === scope.organizationId
    );
  }

  // Platform scope with selected organization
  if (scope.selectedOrganizationId) {
    return items.filter(
      (item) => organizationIdGetter(item) === scope.selectedOrganizationId
    );
  }

  // Platform scope without selection: return all items
  return items;
}

/**
 * Verify scope authorization for a specific action
 * 
 * Throws error if scope is not authorized
 * Returns the scope if authorized
 * 
 * @param scope The communication scope
 * @param requiredMode Optional required mode ("platform" or "organization")
 * @returns The authorized scope
 * @throws Error if not authorized
 */
export function requireCommunicationScope(
  scope: CommunicationScope | null,
  requiredMode?: "platform" | "organization"
): CommunicationScope {
  if (!scope) {
    throw new Error("UNAUTHORIZED: No communication scope");
  }

  if (requiredMode && scope.mode !== requiredMode) {
    throw new Error(
      `UNAUTHORIZED: Required scope mode is ${requiredMode}, got ${scope.mode}`
    );
  }

  return scope;
}

/**
 * Get a human-readable description of the scope
 * Useful for logging and debugging
 * 
 * @param scope The communication scope
 * @returns Description string
 */
export function describeCommunicationScope(scope: CommunicationScope): string {
  if (scope.mode === "platform") {
    if (scope.selectedOrganizationId) {
      return `Platform (filtered to organization: ${scope.selectedOrganizationId})`;
    }
    return "Platform (global)";
  }
  return `Organization (${scope.organizationId})`;
}

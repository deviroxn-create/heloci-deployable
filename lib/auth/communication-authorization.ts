/**
 * COMMUNICATION MODULE - CENTRALIZED AUTHORIZATION HELPER
 * 
 * This module provides role-aware authorization for Communication features.
 * It replaces duplicated authorization logic scattered throughout action files.
 * 
 * Key Architecture:
 * - Platform Super Admins (role=SUPER_ADMIN, organizationId=null) can access any org
 * - Organization-scoped users can only access their own organization
 * - All checks validate that the organizationId is explicitly provided (not assumed)
 * 
 * Usage:
 *   await authorizeCommunicationAccess(organizationId);
 *   await authorizeCommunicationRead(organizationId);
 *   await authorizeCommunicationWrite(organizationId, requiredRoles);
 */

import { getCurrentUser } from '@/lib/auth/session';
import { requireOrgRole } from '@/lib/auth/rbac';

export interface CommunicationAuthContext {
  userId: string;
  organizationId: string;
  role: "SUPER_ADMIN" | "ORG_MEMBER";
  isPlatformAdmin: boolean;
}

/**
 * AUTHORIZATION RULE: General Communication Access
 * 
 * Allows:
 * - Platform Super Admin to access ANY organization (after selection)
 * - Organization members to access their own organization
 * 
 * Denies:
 * - Organization members accessing other organizations
 * - Unauthenticated users
 * 
 * @param organizationId - The organization context for this operation
 * @returns Authorization context if authorized
 * @throws Error if not authorized
 */
export async function authorizeCommunicationAccess(
  organizationId: string
): Promise<CommunicationAuthContext> {
  const user = await getCurrentUser();
  
  if (!user?.id) {
    throw new Error("UNAUTHORIZED: Not authenticated");
  }

  // Platform Super Admin (role=SUPER_ADMIN, organizationId=null)
  // Can access any organization after explicit selection
  if (user.role === "SUPER_ADMIN" && !user.organizationId) {
    return {
      userId: user.id,
      organizationId,
      role: "SUPER_ADMIN",
      isPlatformAdmin: true
    };
  }

  // Organization-scoped user (organizationId is set)
  // Can only access their own organization
  if (user.organizationId) {
    if (user.organizationId !== organizationId) {
      throw new Error("UNAUTHORIZED: Cannot access different organization");
    }

    return {
      userId: user.id,
      organizationId,
      role: "ORG_MEMBER",
      isPlatformAdmin: false
    };
  }

  // User is authenticated but has no organizationId and is not SUPER_ADMIN
  // This should not happen in normal flows but reject it
  throw new Error("UNAUTHORIZED: Invalid user state");
}

/**
 * AUTHORIZATION RULE: Communication Read Operations
 * 
 * Allows:
 * - Platform Super Admin to read from ANY organization
 * - Organization members to read their own organization
 * 
 * Less restrictive than write (no role validation)
 * 
 * @param organizationId - The organization context
 * @returns Authorization result
 * @throws Error if not authorized
 */
export async function authorizeCommunicationRead(
  organizationId: string,
  requiredRoles?: string[]
): Promise<CommunicationAuthContext> {
  const auth = await authorizeCommunicationAccess(organizationId);

  if (requiredRoles && !auth.isPlatformAdmin) {
    try {
      await requireOrgRole(auth.userId, organizationId, requiredRoles);
    } catch (error) {
      throw new Error("UNAUTHORIZED: Insufficient permissions for this operation");
    }
  }

  return auth;
}

/**
 * AUTHORIZATION RULE: Communication Write Operations
 * 
 * More restrictive than read. Requires:
 * - Platform Super Admin, OR
 * - Organization member with sufficient role
 * 
 * @param organizationId - The organization context
 * @param requiredRoles - Roles required for this operation (default: org_admin)
 * @returns Authorization context if authorized
 * @throws Error if not authorized
 */
export async function authorizeCommunicationWrite(
  organizationId: string,
  requiredRoles: string[] = ["org_admin"]
): Promise<CommunicationAuthContext> {
  const user = await getCurrentUser();
  
  if (!user?.id) {
    throw new Error("UNAUTHORIZED: Not authenticated");
  }

  // Platform Super Admin bypass - can write to any org
  if (user.role === "SUPER_ADMIN" && !user.organizationId) {
    return {
      userId: user.id,
      organizationId,
      role: "SUPER_ADMIN",
      isPlatformAdmin: true
    };
  }

  // Organization member - verify role
  if (user.organizationId) {
    if (user.organizationId !== organizationId) {
      throw new Error("UNAUTHORIZED: Cannot modify different organization");
    }

    // Use existing RBAC helper for role validation
    try {
      await requireOrgRole(user.id, organizationId, requiredRoles);
    } catch (error) {
      throw new Error("UNAUTHORIZED: Insufficient permissions for this operation");
    }

    return {
      userId: user.id,
      organizationId,
      role: "ORG_MEMBER",
      isPlatformAdmin: false
    };
  }

  throw new Error("UNAUTHORIZED: Invalid user state");
}

/**
 * AUTHORIZATION RULE: Sender Identity Management
 * 
 * Sender management is restricted to admins only.
 * Platform Super Admin and Organization Admins can manage senders.
 * 
 * @param organizationId - The organization context
 * @returns Authorization context if authorized
 * @throws Error if not authorized
 */
export async function authorizeSenderIdentityAccess(
  organizationId: string
): Promise<CommunicationAuthContext> {
  // Sender management requires admin role
  return authorizeCommunicationWrite(organizationId, ["org_admin"]);
}

/**
 * AUTHORIZATION RULE: Template Management
 * 
 * Template management is restricted to admins.
 * Platform Super Admin and Organization Admins can manage templates.
 * 
 * @param organizationId - The organization context
 * @returns Authorization context if authorized
 * @throws Error if not authorized
 */
export async function authorizeTemplateAccess(
  organizationId: string
): Promise<CommunicationAuthContext> {
  // Template management requires admin role
  return authorizeCommunicationWrite(organizationId, ["org_admin"]);
}

/**
 * AUTHORIZATION RULE: Analytics & Reporting
 * 
 * Analytics require at least viewer role.
 * Platform Super Admin can view any org's analytics.
 * Organization members can view their org's analytics.
 * 
 * @param organizationId - The organization context
 * @returns Authorization context if authorized
 * @throws Error if not authorized
 */
export async function authorizeAnalyticsAccess(
  organizationId: string
): Promise<CommunicationAuthContext> {
  // Analytics are readable, so use read authorization
  return authorizeCommunicationRead(organizationId);
}

/**
 * AUTHORIZATION RULE: Organization Settings
 * 
 * Only organization admins (not Platform Super Admin) can modify org settings.
 * Platform Super Admin can VIEW but not modify (to maintain org autonomy).
 * 
 * Note: This is intentional - we don't want Platform Admin to accidentally
 * change organization settings. They must log into the org as admin.
 * 
 * @param organizationId - The organization context
 * @returns Authorization context if authorized
 * @throws Error if not authorized
 */
export async function authorizeOrganizationSettingsWrite(
  organizationId: string
): Promise<CommunicationAuthContext> {
  const user = await getCurrentUser();
  
  if (!user?.id) {
    throw new Error("UNAUTHORIZED: Not authenticated");
  }

  // Organization member with admin role
  if (user.organizationId) {
    if (user.organizationId !== organizationId) {
      throw new Error("UNAUTHORIZED: Cannot modify different organization");
    }

    try {
      await requireOrgRole(user.id, organizationId, ["org_admin"]);
    } catch (error) {
      throw new Error("UNAUTHORIZED: Only organization admins can modify settings");
    }

    return {
      userId: user.id,
      organizationId,
      role: "ORG_MEMBER",
      isPlatformAdmin: false
    };
  }

  // Platform Super Admin cannot modify org settings (read-only access)
  throw new Error("UNAUTHORIZED: Platform admins cannot modify organization settings. Please use organization admin role.");
}

/**
 * AUTHORIZATION RULE: Recipient Management
 * 
 * Recipients are accessible to communication users.
 * Platform Super Admin can access any org.
 * Organization members can access their org.
 * 
 * @param organizationId - The organization context
 * @returns Authorization context if authorized
 * @throws Error if not authorized
 */
export async function authorizeRecipientAccess(
  organizationId: string
): Promise<CommunicationAuthContext> {
  // Recipients are readable for communication purposes
  return authorizeCommunicationRead(organizationId);
}

/**
 * AUTHORIZATION RULE: Draft & Composition
 * 
 * Users can draft communications if they have access to the organization.
 * Platform Super Admin can draft for any org.
 * Organization members can draft for their org.
 * 
 * @param organizationId - The organization context
 * @returns Authorization context if authorized
 * @throws Error if not authorized
 */
export async function authorizeDraftAccess(
  organizationId: string
): Promise<CommunicationAuthContext> {
  // Drafts are part of general communication access
  return authorizeCommunicationAccess(organizationId);
}

/**
 * AUTHORIZATION RULE: Message Send
 * 
 * Sending messages requires communication access.
 * Platform Super Admin can send from any org.
 * Organization members can send from their org.
 * 
 * @param organizationId - The organization context
 * @returns Authorization context if authorized
 * @throws Error if not authorized
 */
export async function authorizeSendMessage(
  organizationId: string
): Promise<CommunicationAuthContext> {
  return authorizeCommunicationAccess(organizationId);
}

/**
 * AUTHORIZATION RULE: Inbox & Timeline Access
 * 
 * Users can view inbox/timeline for their organization.
 * Platform Super Admin can view any org's inbox after selection.
 * Organization members can view their own inbox.
 * 
 * @param organizationId - The organization context
 * @returns Authorization context if authorized
 * @throws Error if not authorized
 */
export async function authorizeInboxAccess(
  organizationId: string
): Promise<CommunicationAuthContext> {
  return authorizeCommunicationRead(organizationId);
}

/**
 * AUTHORIZATION RULE: Delivery Tracking
 * 
 * Users can track delivery status for their organization.
 * Platform Super Admin can track any org after selection.
 * Organization members can track their org.
 * 
 * @param organizationId - The organization context
 * @returns Authorization context if authorized
 * @throws Error if not authorized
 */
export async function authorizeDeliveryAccess(
  organizationId: string
): Promise<CommunicationAuthContext> {
  return authorizeCommunicationRead(organizationId);
}

/**
 * Verify that a given organizationId is valid and accessible to the user
 * 
 * UTILITY FUNCTION: Use canAccessOrganization(scope, organizationId) from scope.service.ts for canonical check.
 * This version is a utility for cases where you have raw user values instead of scope.
 * 
 * @param organizationId - The organization to verify
 * @param userRole - The user's role
 * @param userOrganizationId - The user's organization
 * @returns true if the user can access this organization
 */
export function canAccessOrganization(
  organizationId: string,
  userRole: string | null | undefined,
  userOrganizationId: string | null | undefined
): boolean {
  // Platform Super Admin (role=SUPER_ADMIN, organizationId=null)
  if (userRole === "SUPER_ADMIN" && !userOrganizationId) {
    return true;
  }

  // Organization member
  if (userOrganizationId === organizationId) {
    return true;
  }

  return false;
}

/**
 * Log authorization decision for debugging
 * Should be used in development/staging to trace authorization flows
 * 
 * @param action - Description of the action
 * @param result - Authorization result or error
 * @param context - Additional context
 */
export function logAuthorizationDecision(
  action: string,
  result: "GRANTED" | "DENIED",
  context?: Record<string, any>
) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[COMMUNICATION_AUTH] ${action}: ${result}`, context || {});
  }
}

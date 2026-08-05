/**
 * APPLICATIONS MODULE - CENTRALIZED AUTHORIZATION HELPER
 * 
 * This module provides role-aware authorization for Application review and management.
 * It replaces duplicated authorization logic in review-service.ts and API routes.
 * 
 * Key Architecture:
 * - Platform Super Admins (role=SUPER_ADMIN, organizationId=null) can access any org
 * - Organization-scoped users can only access their own organization
 * - All checks validate that the organizationId is explicitly provided (not assumed)
 * 
 * Usage:
 *   await authorizeApplicationRead(organizationId);
 *   await authorizeApplicationWrite(organizationId);
 *   await authorizeApplicationAccess(organizationId);
 */

import { getCurrentUser } from '@/lib/auth/session';
import { requireOrgRole } from '@/lib/auth/rbac';

export interface ApplicationAuthContext {
  userId: string;
  organizationId: string;
  role: "SUPER_ADMIN" | "ORG_MEMBER";
  isPlatformAdmin: boolean;
}

/**
 * AUTHORIZATION RULE: General Application Access
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
export async function authorizeApplicationAccess(
  organizationId: string
): Promise<ApplicationAuthContext> {
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
 * AUTHORIZATION RULE: Application Read Operations
 * 
 * Allows:
 * - Platform Super Admin to read from ANY organization
 * - Organization members to read their own organization
 * 
 * Optional role validation for viewer/reviewer access.
 * 
 * @param organizationId - The organization context
 * @param requiredRoles - Roles required for this operation (optional)
 * @returns Authorization result
 * @throws Error if not authorized
 */
export async function authorizeApplicationRead(
  organizationId: string,
  requiredRoles?: string[]
): Promise<ApplicationAuthContext> {
  const auth = await authorizeApplicationAccess(organizationId);

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
 * AUTHORIZATION RULE: Application Write Operations
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
export async function authorizeApplicationWrite(
  organizationId: string,
  requiredRoles: string[] = ["org_admin"]
): Promise<ApplicationAuthContext> {
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
 * AUTHORIZATION RULE: Application Review Operations
 * 
 * Allows reviewers and admins to read applications.
 * 
 * @param organizationId - The organization context
 * @returns Authorization context if authorized
 * @throws Error if not authorized
 */
export async function authorizeApplicationReview(
  organizationId: string
): Promise<ApplicationAuthContext> {
  // Review requires viewer/reviewer/admin role
  return authorizeApplicationRead(organizationId, ["org_admin", "reviewer", "viewer"]);
}

/**
 * AUTHORIZATION RULE: Application Decision Operations
 * 
 * Allows only reviewers and admins to make decisions on applications.
 * More restrictive than general write.
 * 
 * @param organizationId - The organization context
 * @returns Authorization context if authorized
 * @throws Error if not authorized
 */
export async function authorizeApplicationDecision(
  organizationId: string
): Promise<ApplicationAuthContext> {
  // Decisions require reviewer/admin role
  return authorizeApplicationWrite(organizationId, ["org_admin", "reviewer"]);
}

/**
 * AUTHORIZATION RULE: Application Administration
 * 
 * Allows only admins to perform administrative operations (assign, reassign).
 * 
 * @param organizationId - The organization context
 * @returns Authorization context if authorized
 * @throws Error if not authorized
 */
export async function authorizeApplicationAdmin(
  organizationId: string
): Promise<ApplicationAuthContext> {
  // Admin operations require org_admin role only
  return authorizeApplicationWrite(organizationId, ["org_admin"]);
}

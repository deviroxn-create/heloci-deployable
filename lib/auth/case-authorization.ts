/**
 * CASE MANAGEMENT MODULE - CENTRALIZED AUTHORIZATION HELPER
 * 
 * This module provides role-aware authorization for Case review and management.
 * It replaces duplicated authorization logic in case-service.ts, decision.service.ts, 
 * document-review.service.ts, and review-checklist.service.ts.
 * 
 * Key Architecture:
 * - Platform Super Admins (role=SUPER_ADMIN, organizationId=null) can access any org
 * - Organization-scoped users can only access their own organization
 * - All checks validate that the organizationId is explicitly provided (not assumed)
 * 
 * Role Hierarchy:
 * - org_admin: Full access (read, write, assign, decide, admin)
 * - reviewer: Read, write, assign, decide (not admin config)
 * - case_worker: Read, write, basic updates (not decisions, not admin)
 * - viewer: Read-only (no write, no decisions, no admin)
 * 
 * Usage:
 *   await authorizeCaseRead(organizationId);
 *   await authorizeCaseWrite(organizationId);
 *   await authorizeCaseDecision(organizationId);
 *   await authorizeCaseAdmin(organizationId);
 */

import { getCurrentUser } from '@/lib/auth/session';
import { requireOrgRole } from '@/lib/auth/rbac';

export interface CaseAuthContext {
  userId: string;
  organizationId: string;
  role: "SUPER_ADMIN" | "ORG_MEMBER";
  isPlatformAdmin: boolean;
}

/**
 * AUTHORIZATION RULE: General Case Access
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
export async function authorizeCaseAccess(
  organizationId: string
): Promise<CaseAuthContext> {
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
 * AUTHORIZATION RULE: Case Read Operations
 * 
 * Allows:
 * - Platform Super Admin to read from ANY organization
 * - Organization members to read their own organization
 * - Viewers, case workers, reviewers, and admins
 * 
 * @param organizationId - The organization context
 * @param requiredRoles - Roles required for this operation (default: org_admin, reviewer, viewer, case_worker)
 * @returns Authorization context if authorized
 * @throws Error if not authorized
 */
export async function authorizeCaseRead(
  organizationId: string,
  requiredRoles: string[] = ["org_admin", "reviewer", "viewer", "case_worker"]
): Promise<CaseAuthContext> {
  const auth = await authorizeCaseAccess(organizationId);

  if (!auth.isPlatformAdmin) {
    try {
      await requireOrgRole(auth.userId, organizationId, requiredRoles);
    } catch (error) {
      throw new Error("UNAUTHORIZED: Insufficient permissions for this operation");
    }
  }

  return auth;
}

/**
 * AUTHORIZATION RULE: Case Write Operations
 * 
 * More restrictive than read. Allows:
 * - Platform Super Admin
 * - Organization member with reviewer or admin role
 * - Case workers for basic updates (notes, etc.)
 * 
 * @param organizationId - The organization context
 * @param requiredRoles - Roles required for this operation (default: org_admin, reviewer, case_worker)
 * @returns Authorization context if authorized
 * @throws Error if not authorized
 */
export async function authorizeCaseWrite(
  organizationId: string,
  requiredRoles: string[] = ["org_admin", "reviewer", "case_worker"]
): Promise<CaseAuthContext> {
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
 * AUTHORIZATION RULE: Case Assignment Operations
 * 
 * Allows only admins and reviewers to assign cases.
 * More restrictive than general write.
 * 
 * @param organizationId - The organization context
 * @returns Authorization context if authorized
 * @throws Error if not authorized
 */
export async function authorizeCaseAssignment(
  organizationId: string
): Promise<CaseAuthContext> {
  // Assignment requires reviewer/admin role
  return authorizeCaseWrite(organizationId, ["org_admin", "reviewer"]);
}

/**
 * AUTHORIZATION RULE: Case Decision Operations
 * 
 * Allows only reviewers and admins to make decisions on cases.
 * Most restrictive write operation.
 * 
 * @param organizationId - The organization context
 * @returns Authorization context if authorized
 * @throws Error if not authorized
 */
export async function authorizeCaseDecision(
  organizationId: string
): Promise<CaseAuthContext> {
  // Decisions require reviewer/admin role
  return authorizeCaseWrite(organizationId, ["org_admin", "reviewer"]);
}

/**
 * AUTHORIZATION RULE: Case Administration
 * 
 * Allows only admins to perform administrative operations.
 * 
 * @param organizationId - The organization context
 * @returns Authorization context if authorized
 * @throws Error if not authorized
 */
export async function authorizeCaseAdmin(
  organizationId: string
): Promise<CaseAuthContext> {
  // Admin operations require org_admin role only
  return authorizeCaseWrite(organizationId, ["org_admin"]);
}

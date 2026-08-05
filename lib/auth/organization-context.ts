/**
 * Organization Context Helper
 * 
 * Handles organization context resolution for API endpoints,
 * with special support for Platform Super Admin
 */

import { prisma } from "@/lib/prisma/client";

export interface UserContext {
  id: string;
  role: string;
  organizationId: string | null;
  isPlatformAdmin?: boolean;
}

/**
 * Get organization ID for current request
 * 
 * For regular users: Returns their organizationId
 * For Platform Super Admin: Returns provided orgId parameter or first active org
 * 
 * @param user - Current user from getCurrentUser()
 * @param orgIdParam - Optional organizationId from query/body (for Super Admin)
 * @returns organizationId or throws error
 */
export async function getOrganizationContext(
  user: UserContext,
  orgIdParam?: string | null
): Promise<string> {
  // Platform Super Admin can access any organization
  if (user.isPlatformAdmin) {
    // If org specified, use it
    if (orgIdParam) {
      // Verify org exists
      const org = await prisma.organization.findUnique({
        where: { id: orgIdParam },
        select: { id: true, isActive: true }
      });
      
      if (!org) {
        throw new Error("ORGANIZATION_NOT_FOUND");
      }
      
      if (!org.isActive) {
        throw new Error("ORGANIZATION_INACTIVE");
      }
      
      return orgIdParam;
    }
    
    // Default to first active org
    const firstOrg = await prisma.organization.findFirst({
      where: { isActive: true },
      select: { id: true },
      orderBy: { createdAt: "asc" }
    });
    
    if (!firstOrg) {
      throw new Error("NO_ORGANIZATIONS_AVAILABLE");
    }
    
    return firstOrg.id;
  }
  
  // Regular user - must have organizationId
  if (!user.organizationId) {
    throw new Error("NO_ORGANIZATION");
  }
  
  return user.organizationId;
}

/**
 * Check if user can access specified organization
 * 
 * @param user - Current user
 * @param organizationId - Organization to check access for
 * @returns true if user has access
 */
export async function canAccessOrganization(
  user: UserContext,
  organizationId: string
): Promise<boolean> {
  // Platform Super Admin can access any org
  if (user.isPlatformAdmin) {
    return true;
  }
  
  // Regular users can only access their own org
  return user.organizationId === organizationId;
}

/**
 * Require user to have access to specified organization
 * Throws error if access denied
 */
export async function requireOrganizationAccess(
  user: UserContext,
  organizationId: string
): Promise<void> {
  const hasAccess = await canAccessOrganization(user, organizationId);
  
  if (!hasAccess) {
    throw new Error("ORGANIZATION_ACCESS_DENIED");
  }
}

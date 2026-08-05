import { prisma } from "@/lib/prisma/client";

/**
 * Organization roles supported by the platform
 */
export const OrgRoles = {
  SUPER_ADMIN: "super_admin",        // Platform Super Admin (bypasses org checks)
  ORG_ADMIN: "org_admin",            // Organization Administrator
  MANAGER: "manager",                 // Manager/Supervisor
  REVIEWER: "reviewer",               // Case Reviewer
  CASE_WORKER: "case_worker",        // Case Worker
  DOCUMENT_OFFICER: "document_officer", // Document Officer
  VIEWER: "viewer"                    // View-only access
} as const;

/**
 * Check if user has required organization role
 * Platform Super Admin (role = SUPER_ADMIN, organizationId = NULL) bypasses all checks
 */
export async function requireOrgRole(userId: string, organizationId: string, roles: string[]) {
  console.log("[RBAC] requireOrgRole called:", {
    userId,
    organizationId,
    requiredRoles: roles
  });

  // Check if user is Platform Super Admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, organizationId: true, email: true }
  });

  console.log("[RBAC] User lookup result:", {
    userId,
    userRole: user?.role,
    userOrganizationId: user?.organizationId,
    userEmail: user?.email
  });

  // Platform Super Admin bypasses organization checks
  if (user?.role === "SUPER_ADMIN" && !user.organizationId) {
    console.log("[RBAC] ✓ Platform Super Admin bypass granted");
    return {
      id: `super-admin-${userId}`,
      organizationId,
      userId,
      role: OrgRoles.SUPER_ADMIN,
      createdAt: new Date()
    };
  }

  // Regular organization member check
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } }
  });

  console.log("[RBAC] OrganizationMember lookup:", {
    organizationId,
    userId,
    memberFound: !!member,
    memberRole: member?.role
  });
  
  if (!member) {
    console.error("[RBAC] ✗ UNAUTHORIZED: No OrganizationMember record found");
    throw new Error("Unauthorized");
  }

  console.log("[RBAC] Role check:", {
    memberRole: member.role,
    memberRoleType: typeof member.role,
    requiredRoles: roles,
    includes: roles.includes(member.role),
    rolesArray: JSON.stringify(roles),
    memberRoleString: JSON.stringify(member.role)
  });

  if (!roles.includes(member.role)) {
    console.error("[RBAC] ✗ UNAUTHORIZED: User role not in required roles", {
      userRole: member.role,
      requiredRoles: roles
    });
    throw new Error("Unauthorized");
  }

  console.log("[RBAC] ✓ Authorization granted:", {
    organizationId,
    userId,
    role: member.role
  });
  
  return member;
}

/**
 * Check if user has any of the specified roles in their organization
 * Platform Super Admin always passes
 */
export async function hasOrgRole(userId: string, organizationId: string, roles: string[]): Promise<boolean> {
  try {
    await requireOrgRole(userId, organizationId, roles);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all organizations user belongs to
 * Platform Super Admin returns all organizations
 */
export async function getUserOrganizations(userId: string) {
  // Check if Platform Super Admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, organizationId: true }
  });

  // Platform Super Admin sees all organizations
  if (user?.role === "SUPER_ADMIN" && !user.organizationId) {
    return prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        isActive: true
      }
    });
  }

  // Regular user sees only their organizations
  return prisma.organizationMember.findMany({
    where: { userId },
    include: { organization: true }
  });
}

/**
 * Check if user is Platform Super Admin
 */
export async function isPlatformSuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, organizationId: true }
  });
  
  return user?.role === "SUPER_ADMIN" && !user.organizationId;
}

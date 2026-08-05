/**
 * ORGANIZATION CONTEXT SERVICE
 * 
 * Manages the active organization context for multi-tenant Communication Hub.
 * 
 * Platform Super Admins (SUPER_ADMIN with organizationId = null) use this to
 * select which organization they want to manage.
 * 
 * Organization Admins/Staff/Applicants always have organizationId set, so
 * this context is pre-populated from their session.
 */

import { Organization } from '@prisma/client';

export interface OrganizationContext {
  id: string;
  name: string;
  slug?: string;
  logo?: string;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
}

/**
 * Get all organizations for a user
 * Used by Platform Super Admin to select organization
 */
export async function getOrganizationsForUser(user: { role?: string | null; organizationId?: string | null }) {
  const { prisma } = await import('@/lib/prisma/client');

  if (user.role === 'SUPER_ADMIN' && !user.organizationId) {
    return prisma.organization.findMany({
      select: { id: true, name: true, slug: true, logoUrl: true },
      orderBy: { name: 'asc' },
    });
  }

  if (user.organizationId) {
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { id: true, name: true, slug: true, logoUrl: true },
    });

    return organization ? [organization] : [];
  }

  return [];
}

export async function getAvailableOrganizations() {
  const { prisma } = await import('@/lib/prisma/client');
  
  return prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Get organization details
 */
export async function getOrganizationContext(organizationId: string): Promise<OrganizationContext | null> {
  const { prisma } = await import('@/lib/prisma/client');
  
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
    },
  });

  if (!org) return null;

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    logo: org.logoUrl || undefined,
  };
}

/**
 * Store active organization in session/cookie
 * This is handled by the provider component
 */
export const ACTIVE_ORG_COOKIE = 'active_organization_id';
export const ACTIVE_ORG_SESSION_KEY = 'active_organization_id';

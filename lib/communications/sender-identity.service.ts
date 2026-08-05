/**
 * SENDER IDENTITY SERVICE
 * Manages email sender identities for organizations
 * 
 * Responsibilities:
 * - CRUD operations for SenderIdentity
 * - Sender verification status management
 * - Default sender management
 * - Organization sender isolation
 * - Audit trail of sender changes
 * - Multi-tenant support: respects CommunicationScope
 */

import { prisma } from '@/lib/prisma/client';
import { SenderIdentity, SenderVerificationStatus } from '@prisma/client';
import { CommunicationScope, getScopeFilter, canAccessOrganization } from '@/lib/communications/scope.service';

export interface SenderIdentityWithUsage extends SenderIdentity {
  sentCount?: number;
  lastUsedAt?: Date;
  creatorName?: string;
}

// Re-export types for convenience
export type { SenderIdentity };
export { SenderVerificationStatus };

/**
 * Get all sender identities for organization(s) based on scope
 * 
 * Platform Super Admin: returns all sender identities across organizations (or filtered to selectedOrgId)
 * Organization Admin: returns only their organization's sender identities
 */
export async function getSenderIdentities(scope: CommunicationScope): Promise<SenderIdentityWithUsage[]> {
  const whereClause = scope.mode === "platform" 
    ? (scope.selectedOrganizationId ? { organizationId: scope.selectedOrganizationId, isActive: true } : { isActive: true })
    : { organizationId: scope.organizationId, isActive: true };

  const identities = await prisma.senderIdentity.findMany({
    where: whereClause,
    include: { creator: { select: { name: true } } },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  // Enhance with usage data
  const withUsage = await Promise.all(
    identities.map(async (identity) => {
      const notificationLogs = await prisma.notificationLog.findMany({
        where: { senderIdentityId: identity.id },
        select: { id: true, sentAt: true },
        orderBy: { sentAt: 'desc' },
        take: 1,
      });

      return {
        ...identity,
        creatorName: identity.creator?.name || undefined,
        sentCount: await prisma.notificationLog.count({
          where: { senderIdentityId: identity.id },
        }),
        lastUsedAt: notificationLogs[0]?.sentAt || undefined,
      };
    })
  );

  return withUsage;
}

/**
 * Get a single sender identity
 */
export async function getSenderIdentity(id: string, scope: CommunicationScope): Promise<SenderIdentity | null> {
  const sender = await prisma.senderIdentity.findFirst({
    where: { id },
  });

  if (!sender) return null;

  // Verify scope has access to this organization
  if (!canAccessOrganization(scope, sender.organizationId)) {
    throw new Error("UNAUTHORIZED: Cannot access sender identity from different organization");
  }

  return sender;
}

/**
 * Get default sender for organization
 */
export async function getDefaultSender(scope: CommunicationScope): Promise<SenderIdentity | null> {
  const whereClause = scope.mode === "platform"
    ? (scope.selectedOrganizationId ? { organizationId: scope.selectedOrganizationId, isDefault: true, isActive: true } : { isDefault: true, isActive: true })
    : { organizationId: scope.organizationId, isDefault: true, isActive: true };

  return prisma.senderIdentity.findFirst({
    where: whereClause,
  });
}

/**
 * Create a new sender identity
 */
export async function createSenderIdentity(input: {
  organizationId: string;
  displayName: string;
  emailAddress: string;
  department?: string;
  replyTo?: string;
  signature?: string;
  logoUrl?: string;
  themeColor?: string;
  isDefault?: boolean;
  createdBy: string;
  scope: CommunicationScope;
}): Promise<SenderIdentity> {
  // Verify scope has access to the organization being modified
  if (!canAccessOrganization(input.scope, input.organizationId)) {
    throw new Error("UNAUTHORIZED: Cannot create sender in different organization");
  }

  // Check for duplicate email in organization
  const existing = await prisma.senderIdentity.findFirst({
    where: {
      organizationId: input.organizationId,
      emailAddress: input.emailAddress,
    },
  });

  if (existing) {
    throw new Error(`Sender with email ${input.emailAddress} already exists in this organization`);
  }

  // If setting as default, unset other defaults
  if (input.isDefault) {
    await prisma.senderIdentity.updateMany({
      where: {
        organizationId: input.organizationId,
        isDefault: true,
      },
      data: { isDefault: false },
    });
  }

  return prisma.senderIdentity.create({
    data: {
      organizationId: input.organizationId,
      displayName: input.displayName,
      emailAddress: input.emailAddress,
      department: input.department,
      replyTo: input.replyTo || input.emailAddress,
      signature: input.signature,
      logoUrl: input.logoUrl,
      themeColor: input.themeColor,
      isDefault: input.isDefault || false,
      isActive: true,
      verificationStatus: 'PENDING' as SenderVerificationStatus,
      createdBy: input.createdBy,
    },
  });
}

/**
 * Update sender identity
 */
export async function updateSenderIdentity(
  id: string,
  scope: CommunicationScope,
  input: {
    displayName?: string;
    department?: string;
    replyTo?: string;
    signature?: string;
    logoUrl?: string;
    themeColor?: string;
    isDefault?: boolean;
  }
): Promise<SenderIdentity> {
  // Verify sender access
  const sender = await prisma.senderIdentity.findUnique({ where: { id } });
  if (!sender) throw new Error("SENDER_NOT_FOUND");
  if (!canAccessOrganization(scope, sender.organizationId)) {
    throw new Error("UNAUTHORIZED: Cannot update sender from different organization");
  }

  // If setting as default, unset other defaults
  if (input.isDefault === true) {
    await prisma.senderIdentity.updateMany({
      where: {
        organizationId: sender.organizationId,
        isDefault: true,
        id: { not: id },
      },
      data: { isDefault: false },
    });
  }

  return prisma.senderIdentity.update({
    where: { id },
    data: {
      displayName: input.displayName,
      department: input.department,
      replyTo: input.replyTo,
      signature: input.signature,
      logoUrl: input.logoUrl,
      themeColor: input.themeColor,
      isDefault: input.isDefault,
      updatedAt: new Date(),
    },
  });
}

/**
 * Delete sender identity (soft delete / disable)
 */
export async function deleteSenderIdentity(id: string, scope: CommunicationScope): Promise<SenderIdentity> {
  const sender = await prisma.senderIdentity.findUnique({ where: { id } });
  if (!sender) throw new Error("SENDER_NOT_FOUND");
  if (!canAccessOrganization(scope, sender.organizationId)) {
    throw new Error("UNAUTHORIZED: Cannot delete sender from different organization");
  }

  return prisma.senderIdentity.update({
    where: { id },
    data: { isActive: false, updatedAt: new Date() },
  });
}

/**
 * Enable sender identity
 */
export async function enableSenderIdentity(id: string, scope: CommunicationScope): Promise<SenderIdentity> {
  const sender = await prisma.senderIdentity.findUnique({ where: { id } });
  if (!sender) throw new Error("SENDER_NOT_FOUND");
  if (!canAccessOrganization(scope, sender.organizationId)) {
    throw new Error("UNAUTHORIZED: Cannot enable sender from different organization");
  }

  return prisma.senderIdentity.update({
    where: { id },
    data: { isActive: true, updatedAt: new Date() },
  });
}

/**
 * Set sender as default
 */
export async function setDefaultSender(id: string, scope: CommunicationScope): Promise<SenderIdentity> {
  const sender = await prisma.senderIdentity.findUnique({ where: { id } });
  if (!sender) throw new Error("SENDER_NOT_FOUND");
  if (!canAccessOrganization(scope, sender.organizationId)) {
    throw new Error("UNAUTHORIZED: Cannot set sender as default from different organization");
  }

  // Unset other defaults
  await prisma.senderIdentity.updateMany({
    where: {
      organizationId: sender.organizationId,
      isDefault: true,
      id: { not: id },
    },
    data: { isDefault: false },
  });

  return prisma.senderIdentity.update({
    where: { id },
    data: { isDefault: true, updatedAt: new Date() },
  });
}

/**
 * Update verification status
 */
export async function updateVerificationStatus(
  id: string,
  status: SenderVerificationStatus,
  errorMessage?: string
): Promise<SenderIdentity> {
  return prisma.senderIdentity.update({
    where: { id },
    data: {
      verificationStatus: status,
      lastVerifiedAt: status === 'VERIFIED' ? new Date() : undefined,
      verificationError: errorMessage,
      updatedAt: new Date(),
    },
  });
}

/**
 * Get sender for use in notification (respects priority: template > org default > event default)
 */
export async function resolveSender(
  scope: CommunicationScope,
  templateSenderId?: string,
): Promise<SenderIdentity | null> {
  // Priority 1: Template-specified sender
  if (templateSenderId) {
    const templateSender = await prisma.senderIdentity.findFirst({
      where: { id: templateSenderId, isActive: true },
    });
    if (templateSender && canAccessOrganization(scope, templateSender.organizationId)) {
      return templateSender;
    }
  }

  // Priority 2: Organization default sender
  const defaultSender = await getDefaultSender(scope);
  if (defaultSender) return defaultSender;

  // Priority 3: First active sender
  const whereClause = scope.mode === "platform"
    ? (scope.selectedOrganizationId ? { organizationId: scope.selectedOrganizationId, isActive: true } : { isActive: true })
    : { organizationId: scope.organizationId, isActive: true };

  const firstSender = await prisma.senderIdentity.findFirst({
    where: whereClause,
    orderBy: { createdAt: 'asc' },
  });

  return firstSender;
}

/**
 * Get sender identities for a template
 */
export async function getTemplateSenderMapping(organizationId: string): Promise<
  Array<{
    eventName: string;
    templateId: string;
    templateName: string;
    senderId?: string;
    senderEmail?: string;
    senderName?: string;
  }>
> {
  const templates = await prisma.notificationTemplate.findMany({
    where: { active: true },
    include: {
      senderIdentity: {
        select: {
          id: true,
          emailAddress: true,
          displayName: true,
        },
      },
    },
  });

  return templates.map((t) => ({
    eventName: t.eventName,
    templateId: t.id,
    templateName: t.name,
    senderId: t.senderIdentity?.id,
    senderEmail: t.senderIdentity?.emailAddress,
    senderName: t.senderIdentity?.displayName,
  }));
}

/**
 * Get sender usage statistics
 */
export async function getSenderUsage(id: string, scope: CommunicationScope, days: number = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [sent, delivered, failed, opened] = await Promise.all([
    prisma.notificationLog.count({
      where: {
        senderIdentityId: id,
        createdAt: { gte: startDate },
      },
    }),
    prisma.notificationLog.count({
      where: {
        senderIdentityId: id,
        deliveryStatus: 'DELIVERED',
        createdAt: { gte: startDate },
      },
    }),
    prisma.notificationLog.count({
      where: {
        senderIdentityId: id,
        deliveryStatus: 'FAILED',
        createdAt: { gte: startDate },
      },
    }),
    prisma.notificationLog.count({
      where: {
        senderIdentityId: id,
        deliveryStatus: 'READ',
        createdAt: { gte: startDate },
      },
    }),
  ]);

  return {
    sent,
    delivered,
    failed,
    opened,
    deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
    failureRate: sent > 0 ? Math.round((failed / sent) * 100) : 0,
  };
}

import { prisma } from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";

export async function getOrganizationAdminData(orgId: string, userId: string) {
  const [organization, members, invitations, auditLogs, settings] = await Promise.all([
    prisma.$queryRawUnsafe<any[]>(`
      SELECT
        id,
        name,
        slug,
        description,
        "logoUrl",
        website,
        "emailFromName",
        "telegramChannelId",
        preferences,
        "createdAt",
        "isActive"
      FROM "Organization"
      WHERE id = ${orgId}
      LIMIT 1
    `).then((rows) => rows[0] ?? null),
    prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.invitation.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" }
    }),
    prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.communicationSettings.findUnique({ where: { id: "default" } })
  ]);

  return {
    organization,
    members,
    invitations,
    auditLogs,
    settings: settings ?? {}
  };
}

export async function updateOrganizationProfile(orgId: string, input: {
  name?: string;
  slug?: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  emailFromName?: string;
  telegramChannelId?: string;
}) {
  const updated = await prisma.organization.update({
    where: { id: orgId },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      website: input.website,
      logoUrl: input.logoUrl,
      emailFromName: input.emailFromName,
      telegramChannelId: input.telegramChannelId
    }
  });

  return updated;
}

export async function saveOrganizationPreferences(orgId: string, preferences: Record<string, unknown>) {
  await prisma.$executeRawUnsafe(`
    UPDATE "Organization"
    SET preferences = ${JSON.stringify(preferences)}::jsonb
    WHERE id = ${orgId}
  `);

  const updated = await prisma.$queryRawUnsafe<any[]>(`
    SELECT
      id,
      name,
      slug,
      description,
      "logoUrl",
      website,
      "emailFromName",
      "telegramChannelId",
      preferences,
      "createdAt",
      "isActive"
    FROM "Organization"
    WHERE id = ${orgId}
    LIMIT 1
  `).then((rows) => rows[0] ?? null);

  return updated;
}

export async function createOrganizationAuditLog(userId: string, entity: string, action: string, meta: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: {
      userId,
      entity,
      action,
      meta: meta as any
    }
  });
}

export function revalidateOrganizationAdminViews() {
  revalidatePath("/admin/settings");
}

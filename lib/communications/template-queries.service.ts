import { prisma } from "@/lib/prisma/client";

export async function listEmailTemplatesForOrganization(organizationId: string) {
  return prisma.notificationTemplate.findMany({
    where: {
      status: "PUBLISHED",
      OR: [{ organizationId }, { organizationId: null }]
    },
    select: {
      id: true,
      name: true,
      subject: true,
      plainText: true,
      version: true,
      status: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { updatedAt: "desc" }
  });
}

export async function listTemplates(where: any, skip: number, take: number) {
  return prisma.notificationTemplate.findMany({
    where,
    select: {
      id: true,
      name: true,
      subject: true,
      title: true,
      plainText: true,
      variables: true,
      eventName: true,
      channel: true,
      status: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
    skip,
    take
  });
}

export async function countTemplates(where: any) {
  return prisma.notificationTemplate.count({ where });
}

export async function getTemplateById(templateId: string, organizationId?: string) {
  return prisma.notificationTemplate.findFirst({
    where: {
      id: templateId,
      ...(organizationId ? { OR: [{ organizationId }, { organizationId: null }] } : {})
    }
  });
}

export async function createOrUpdateTemplate(templateId: string | undefined, input: {
  name: string;
  subject?: string;
  body: string;
  eventName: string;
  channel: string;
  status: string;
  variables: string[];
  html: string;
  organizationId?: string;
}) {
  if (templateId) {
    const existing = await getTemplateById(templateId, input.organizationId);
    if (!existing) throw new Error("Template not found");

    return prisma.notificationTemplate.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        subject: input.subject,
        plainText: input.body,
        html: input.html,
        variables: input.variables,
        status: input.status as any,
        updatedAt: new Date(),
        organizationId: input.organizationId ?? existing.organizationId
      }
    });
  }

  return prisma.notificationTemplate.create({
    data: {
      name: input.name,
      title: input.name,
      subject: input.subject || "",
      plainText: input.body,
      html: input.html,
      eventName: input.eventName,
      channel: input.channel,
      variables: input.variables,
      status: input.status as any,
      active: true,
      version: 1,
      organizationId: input.organizationId
    }
  });
}

export async function deleteTemplateRecord(templateId: string, organizationId?: string) {
  const existing = await getTemplateById(templateId, organizationId);
  if (!existing) throw new Error("Template not found");

  return prisma.notificationTemplate.update({
    where: { id: existing.id },
    data: { active: false }
  });
}

export async function listFavoriteTemplates(take: number, organizationId?: string) {
  return prisma.notificationTemplate.findMany({
    where: {
      active: true,
      status: "PUBLISHED",
      channel: { in: ["email", "internal_message"] },
      ...(organizationId ? { OR: [{ organizationId }, { organizationId: null }] } : {})
    },
    orderBy: { updatedAt: "desc" },
    take
  });
}

export async function listRecentTemplates(take: number, organizationId?: string) {
  return prisma.notificationTemplate.findMany({
    where: {
      active: true,
      status: "PUBLISHED",
      channel: { in: ["email", "internal_message"] },
      ...(organizationId ? { OR: [{ organizationId }, { organizationId: null }] } : {})
    },
    orderBy: { updatedAt: "desc" },
    take
  });
}

export async function previewTemplate(templateId: string, organizationId?: string) {
  return prisma.notificationTemplate.findFirst({
    where: {
      id: templateId,
      ...(organizationId ? { OR: [{ organizationId }, { organizationId: null }] } : {})
    }
  });
}

export async function publishTemplateRecord(templateId: string, organizationId?: string) {
  const existing = await getTemplateById(templateId, organizationId);
  if (!existing) throw new Error("Template not found");

  return prisma.notificationTemplate.update({
    where: { id: existing.id },
    data: {
      status: "PUBLISHED",
      updatedAt: new Date()
    }
  });
}

export async function archiveTemplateRecord(templateId: string, organizationId?: string) {
  const existing = await getTemplateById(templateId, organizationId);
  if (!existing) throw new Error("Template not found");

  return prisma.notificationTemplate.update({
    where: { id: existing.id },
    data: {
      status: "DRAFT",
      updatedAt: new Date()
    }
  });
}

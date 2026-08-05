import { prisma } from "@/lib/prisma/client";
import { publishDomainEvent } from "@/lib/events/domain-event-publisher";

export async function listMessageTemplates(eventNames: string[]) {
  return prisma.notificationTemplate.findMany({
    where: {
      eventName: { in: eventNames },
      channel: "email",
      status: "PUBLISHED",
      active: true
    },
    select: {
      id: true,
      name: true,
      subject: true,
      plainText: true,
      variables: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });
}

export async function countMessageTemplates(eventNames: string[]) {
  return prisma.notificationTemplate.count({
    where: {
      eventName: { in: eventNames },
      channel: "email",
      status: "PUBLISHED",
      active: true
    }
  });
}

export async function getMessageTemplateById(templateId: string) {
  const template = await prisma.notificationTemplate.findUnique({
    where: { id: templateId },
    select: {
      id: true,
      name: true,
      subject: true,
      plainText: true,
      variables: true,
      eventName: true
    }
  });

  if (!template) throw new Error("Template not found");

  let category: "general" | "approval" | "rejection" | "waitlist" | "missing_documents" = "general";
  if (template.eventName.includes("approved")) category = "approval";
  if (template.eventName.includes("rejected")) category = "rejection";
  if (template.eventName.includes("waitlist")) category = "waitlist";
  if (template.eventName.includes("documents_requested")) category = "missing_documents";

  return {
    id: template.id,
    name: template.name,
    subject: template.subject,
    body: template.plainText || "",
    variables: (template.variables as string[]) || [],
    category,
    eventName: template.eventName
  };
}

export async function searchRecipients(query: string, orgId: string, type: "applicant" | "staff" | "admin") {
  if (type === "applicant") {
    return prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } }
        ],
        role: "APPLICANT"
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      },
      take: 20
    });
  }

  return prisma.organizationMember.findMany({
    where: {
      organizationId: orgId,
      ...(type === "admin"
        ? { role: "org_admin", user: { email: { contains: query, mode: "insensitive" } } }
        : { user: { email: { contains: query, mode: "insensitive" } } })
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      }
    },
    take: 20
  }).then((members) => members.map((m) => ({
    id: m.user.id,
    email: m.user.email,
    name: m.user.name,
    role: m.role
  })));
}

export async function searchRecipientsByType(query: string, orgId: string, type: "staff" | "admin") {
  return searchRecipients(query, orgId, type);
}

export async function getAllRecipientTypes() {
  return [];
}

export async function getMessageTemplateCategories() {
  const categories: Array<{ category: string; label: string; icon: string; count: number }> = [];
  const messageCategories = ["general", "approval", "rejection", "waitlist", "missing_documents", "appointment", "reminder"] as const;

  for (const cat of messageCategories) {
    const eventNames = {
      general: ["admin_action"],
      approval: ["application_approved"],
      rejection: ["application_rejected"],
      waitlist: ["application_waitlisted"],
      missing_documents: ["documents_requested"],
      appointment: ["admin_action"],
      reminder: ["admin_action"]
    }[cat];

    const count = await countMessageTemplates(eventNames);
    const labelMap: Record<string, string> = {
      general: "General",
      approval: "Approval",
      rejection: "Rejection",
      waitlist: "Waitlist",
      missing_documents: "Missing Documents",
      appointment: "Appointment",
      reminder: "Reminder"
    };

    const iconMap: Record<string, string> = {
      general: "📧",
      approval: "✅",
      rejection: "❌",
      waitlist: "⏳",
      missing_documents: "📋",
      appointment: "📅",
      reminder: "🔔"
    };

    categories.push({ category: cat, label: labelMap[cat], icon: iconMap[cat], count });
  }

  return categories;
}

export async function getRecipientSearchResult(query: string, orgId: string) {
  const applicants = await searchRecipients(query, orgId, "applicant");
  const staff = await searchRecipientsByType(query, orgId, "staff");
  const admins = await searchRecipientsByType(query, orgId, "admin");

  return { applicants, staff, admins };
}

export async function getUserNotificationProfile(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true }
  });
}

export async function createInternalMessage(input: {
  senderId: string;
  recipientUserId: string;
  subject: string;
  body: string;
}) {
  return prisma.message.create({
    data: {
      senderId: input.senderId,
      recipientId: input.recipientUserId,
      content: `Subject: ${input.subject}\n\n${input.body}`,
    }
  });
}

export async function createInternalMessageForRecipient(input: {
  recipientUserId: string;
  senderName: string;
  body: string;
}) {
  const recipient = await prisma.user.findUnique({
    where: { id: input.recipientUserId }
  });

  if (!recipient) return;

  // PHASE B.7 CERTIFICATION FIX:
  // This function was calling notificationService.notify("admin_action") directly,
  // bypassing the canonical domain event → subscriber → registry pipeline.
  // Now it publishes the domain event instead.
  // The NotificationDomainSubscriber will map "admin.action" → "admin_action" communication event
  // and call notificationService.notify() via the canonical path.
  publishDomainEvent("admin.action", {
    userId: recipient.id,
    recipientEmail: recipient.email,
    title: `Internal message from ${input.senderName}`,
    body: input.body.substring(0, 150),
    audience: "admin",
    deliveryChannels: ["telegram", "internal"]
  });
}

export async function getApplicationForCompose(applicationId: string) {
  return prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: {
      user: { select: { email: true, name: true } },
      program: { select: { name: true, organizationId: true } }
    }
  });
}

export async function getSuggestedTemplateForApplicationStatus(status: string) {
  return prisma.notificationTemplate.findFirst({
    where: {
      eventName: {
        in: getEventNameForStatus(status)
      },
      channel: "email",
      status: "PUBLISHED"
    },
    select: { id: true }
  });
}

function getEventNameForStatus(status: string): string[] {
  const eventMap: Record<string, string[]> = {
    approved: ["application_approved"],
    rejected: ["application_rejected"],
    waitlisted: ["application_waitlisted"],
    more_info_requested: ["documents_requested"],
    under_review: ["application_under_review"],
    pending: []
  };
  return eventMap[status] || [];
}

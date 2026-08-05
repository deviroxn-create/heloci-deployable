import { prisma } from "@/lib/prisma/client";
import { publishDomainEvent } from "@/lib/events/domain-event-publisher";

/**
 * Case Communication Service
 * 
 * Manages all messaging and communication between staff and applicants.
 * For MVP, uses existing Message model with applicationId context.
 * Future: Will migrate to dedicated CaseConversation/CaseCase models.
 */

export interface ConversationMessage {
  id: string;
  senderId: string;
  senderName: string | null;
  senderRole: "staff" | "applicant";
  content: string;
  read: boolean;
  createdAt: Date;
}

export interface ConversationSummary {
  applicationId: string;
  messageCount: number;
  lastMessageAt: Date;
  applicantName: string | null;
  applicantEmail: string;
  programName: string;
  subject: string;
  hasUnread: boolean;
}

/**
 * Get all messages for an application (conversation)
 */
export async function getApplicationConversation(
  applicationId: string,
  userId: string,
  organizationId?: string
) {
  // Get application
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: {
      program: true,
      user: true,
      events: {
        where: { type: "message_sent" },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!application) {
    throw new Error("application_not_found");
  }

  const resolvedOrganizationId = organizationId || application.program.organizationId;

  if (application.program.organizationId !== resolvedOrganizationId) {
    throw new Error("organization_mismatch");
  }

  // Verify access
  const isStaff = userId !== application.userId;
  if (!isStaff) {
    if (application.userId !== userId) {
      throw new Error("unauthorized");
    }
  }

  // Get existing messages (from Message model)
  const messages = await prisma.message.findMany({
    where: { applicationId },
    include: { sender: true, recipient: true },
    orderBy: { createdAt: "asc" },
  });

  // Convert to conversation format
  const conversationMessages: ConversationMessage[] = messages.map((msg) => {
    const isSenderStaff = msg.sender.role === "STAFF" || msg.sender.role === "ADMIN";
    return {
      id: msg.id,
      senderId: msg.senderId,
      senderName: msg.sender.name || msg.sender.email,
      senderRole: isSenderStaff ? "staff" : "applicant",
      content: msg.content,
      read: msg.read,
      createdAt: msg.createdAt,
    };
  });

  return {
    applicationId,
    applicantId: application.userId,
    applicantName: application.user.name,
    applicantEmail: application.user.email,
    programName: application.program.name,
    subject: `Application - ${application.user.name || application.user.email}`,
    messages: conversationMessages,
    lastMessageAt:
      messages.length > 0
        ? messages[messages.length - 1].createdAt
        : application.submittedAt || new Date(),
  };
}

/**
 * Send a message in an application conversation
 */
export async function sendApplicationMessage(
  applicationId: string,
  senderId: string,
  content: string,
  organizationId?: string
) {
  // Get application
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: {
      program: true,
      user: true,
      assignedTo: true,
    },
  });

  if (!application) {
    throw new Error("application_not_found");
  }

  const resolvedOrganizationId = organizationId || application.program.organizationId;

  if (application.program.organizationId !== resolvedOrganizationId) {
    throw new Error("organization_mismatch");
  }

  // Get sender
  const sender = await prisma.user.findUnique({ where: { id: senderId } });
  if (!sender) {
    throw new Error("sender_not_found");
  }

  // Verify access
  const isSenderStaff = sender.role === "STAFF" || sender.role === "ADMIN";
  if (!isSenderStaff) {
    if (application.userId !== senderId) {
      throw new Error("unauthorized");
    }
  }

  // Determine recipient
  const recipientId = isSenderStaff ? application.userId : application.assignedToId || application.program.createdBy;

  if (!recipientId) {
    throw new Error("no_recipient");
  }

  // Create message
  const message = await prisma.message.create({
    data: {
      senderId,
      recipientId,
      applicationId,
      content,
    },
    include: { sender: true, recipient: true },
  });

  // Create timeline event
  await prisma.applicationEvent.create({
    data: {
      applicationId,
      type: "message_sent",
      actorId: senderId,
      metadata: {
        senderRole: isSenderStaff ? "staff" : "applicant",
        messagePreview: content.substring(0, 100),
      },
    },
  });

  // Publish a shared message notification event
  if (isSenderStaff) {
    // Send to applicant
    publishDomainEvent("message.created", {
      userId: application.userId,
      recipientId: application.userId,
      recipientEmail: application.user.email,
      recipient: application.user.email,
      applicationId,
      programId: application.program.id,
      organizationId: application.program.organizationId,
      programName: application.program.name,
      messagePreview: content.substring(0, 100),
    });
  } else {
    // Send to assigned staff
    if (application.assignedToId && application.assignedTo?.email) {
      publishDomainEvent("admin.action", {
        userId: application.assignedToId,
        recipientId: application.assignedToId,
        recipientEmail: application.assignedTo.email,
        recipient: application.assignedTo.email,
        applicationId,
        programId: application.program.id,
        organizationId: application.program.organizationId,
        programName: application.program.name,
        messagePreview: content.substring(0, 100),
      });
    }
  }

  return message;
}

/**
 * Mark messages as read
 */
export async function markApplicationMessagesAsRead(
  applicationId: string,
  userId: string,
  organizationId?: string
) {
  // Get application to verify access
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: { program: true },
  });

  if (!application) {
    throw new Error("application_not_found");
  }

  if (application.program.organizationId !== organizationId) {
    throw new Error("organization_mismatch");
  }

  // Verify access
  const isStaff = userId !== application.userId;
  if (!isStaff) {
    if (application.userId !== userId) {
      throw new Error("unauthorized");
    }
  }

  // Mark messages as read
  await prisma.message.updateMany({
    where: {
      applicationId,
      recipientId: userId,
    },
    data: {
      read: true,
    },
  });
}

/**
 * Get staff conversations (list of applications with messages)
 */
export async function getStaffConversations(
  staffUserId: string,
  organizationId: string,
  filters?: {
    unreadOnly?: boolean;
    page?: number;
    pageSize?: number;
  }
) {
  const pageSize = filters?.pageSize ?? 25;
  const page = filters?.page ?? 1;
  const skip = (page - 1) * pageSize;

  // Get applications with messages
  const [applications, total] = await Promise.all([
    prisma.programApplication.findMany({
      where: {
        program: { organizationId },
      },
      include: {
        user: true,
        program: true,
      },
      orderBy: { lastActivityAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.programApplication.count({
      where: { program: { organizationId } },
    }),
  ]);

  const conversations = await Promise.all(
    applications.map(async (app) => {
      const lastMessage = await prisma.message.findFirst({
        where: { applicationId: app.id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

      return {
        applicationId: app.id,
        applicantName: app.user.name,
        applicantEmail: app.user.email,
        programName: app.program.name,
        lastMessageAt: lastMessage?.createdAt || app.lastActivityAt,
        hasMessages: !!lastMessage,
      };
    })
  );

  return {
    conversations,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get applicant conversations
 */
export async function getApplicantConversations(userId: string) {
  const applications = await prisma.programApplication.findMany({
    where: { userId },
    include: {
      program: true,
    },
    orderBy: { lastActivityAt: "desc" },
  });

  const conversations = await Promise.all(
    applications.map(async (app) => {
      const lastMessage = await prisma.message.findFirst({
        where: { applicationId: app.id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

      return {
        applicationId: app.id,
        programName: app.program.name,
        organizationId: app.program.organizationId,
        lastMessageAt: lastMessage?.createdAt || app.lastActivityAt,
        hasMessages: !!lastMessage,
      };
    })
  );

  return conversations;
}

/**
 * Request documents within a conversation (creates event + notification)
 */
export async function requestDocumentsViaMessage(
  applicationId: string,
  documentTypes: string[],
  messageContent: string,
  staffUserId: string,
  organizationId: string
) {
  // Get application
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: {
      program: true,
      user: true,
    },
  });

  if (!application) {
    throw new Error("application_not_found");
  }

  if (application.program.organizationId !== organizationId) {
    throw new Error("organization_mismatch");
  }

  // Send message
  const message = await sendApplicationMessage(
    applicationId,
    staffUserId,
    messageContent,
    organizationId
  );

  // Create document requests
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const requests = await Promise.all(
    documentTypes.map((docType) =>
      prisma.documentRequest.create({
        data: {
          applicationId,
          documentType: docType,
          status: "pending",
          requestedBy: staffUserId,
          expiresAt,
        },
      })
    )
  );

  // Publish document request event for the shared notification runtime
  publishDomainEvent("documents.requested", {
    userId: application.userId,
    recipientId: application.userId,
    recipientEmail: application.user.email,
    applicationId,
    programId: application.program.id,
    organizationId: application.program.organizationId,
    programName: application.program.name,
    documentCount: documentTypes.length,
    expiresAt: expiresAt.toISOString(),
  });

  return { message, requests };
}

/**
 * HELOCI CASE COMMUNICATION CENTER SERVICE
 * 
 * Production-grade service for all application case communication.
 * Uses CaseConversation and CaseMessage models (NOT the old Message model).
 * 
 * ARCHITECTURAL PRINCIPLES:
 * - All communication belongs to ONE application via CaseConversation
 * - Uses CaseMessage model for all messages
 * - Internal staff notes stored in StaffNote (hidden from applicants)
 * - Complete audit trail via ApplicationEvent
 * - RBAC enforced on every operation
 * - Organization isolation guaranteed
 * - Multi-tenant support: accepts CommunicationScope instead of hardcoded organizationId
 */

import { prisma } from "@/lib/prisma/client";
import { notificationService } from "@/lib/notifications/notification.service";
import { publishDomainEvent } from "@/lib/events/domain-event-publisher";
import { 
  CommunicationScope, 
  getEffectiveOrganizationId,
  getOperationOrganizationId,
  canAccessOrganization,
  getScopeFilter 
} from "@/lib/communications/scope.service";

// MESSAGE TYPES - Each has distinct UI/color treatment
export enum MessageType {
  NORMAL = "normal",
  INFORMATION = "information",
  QUESTION = "question",
  DOCUMENT_REQUEST = "document_request",
  STATUS_UPDATE = "status_update",
  APPROVAL_NOTICE = "approval",
  REJECTION_NOTICE = "rejection",
  SYSTEM_NOTIFICATION = "system",
  INTERNAL_STAFF_NOTE = "internal_note",
}

/**
 * Get or create conversation for an application
 */
export async function getOrCreateConversation(
  applicationId: string,
  userId: string,
  scope: CommunicationScope
) {
  // Verify application access
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: {
      program: { include: { organization: true } },
      user: true,
    },
  });

  if (!application) throw new Error("APPLICATION_NOT_FOUND");
  
  // Check that scope has access to this organization
  if (!canAccessOrganization(scope, application.program.organization.id)) {
    throw new Error("ORGANIZATION_MISMATCH");
  }

  // Check access
  const isApplicant = userId === application.userId;

  // Get or create case conversation
  let conversation = await prisma.caseConversation.findUnique({
    where: { applicationId },
  });

  if (!conversation) {
    conversation = await prisma.caseConversation.create({
      data: {
        applicationId,
        subject: `Case ${application.id.slice(0, 8)} - ${application.user.name || application.user.email}`,
        lastMessageAt: new Date(),
      },
    });
  }

  return conversation;
}

/**
 * Load complete case conversation with timeline
 */
export async function getConversation(
  applicationId: string,
  userId: string,
  scope: CommunicationScope,
  options?: {
    page?: number;
    pageSize?: number;
  }
) {
  const pageSize = options?.pageSize ?? 100;
  const page = options?.page ?? 1;
  const skip = (page - 1) * pageSize;

  // Verify application access
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: {
      program: { include: { organization: true } },
      user: true,
      assignedTo: true,
    },
  });

  if (!application) throw new Error("APPLICATION_NOT_FOUND");
  if (!canAccessOrganization(scope, application.program.organization.id)) {
    throw new Error("ORGANIZATION_MISMATCH");
  }

  const isApplicant = userId === application.userId;
  const isStaff = !isApplicant;

  if (!isStaff) {
    if (userId !== application.userId) throw new Error("UNAUTHORIZED");
  }

  // Get or create conversation
  let conversation = await prisma.caseConversation.findUnique({
    where: { applicationId },
    include: {
      propertyInterest: {
        include: {
          programProperty: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  address: true,
                  city: true,
                  state: true,
                  zip: true,
                  rent: true,
                  rentMax: true,
                  bedrooms: true,
                  bathrooms: true,
                  sqft: true,
                  amenities: true,
                  images: { select: { id: true, url: true, altText: true } },
                  units: { where: { available: true }, select: { id: true, beds: true, price: true, available: true } },
                },
              },
            },
          },
        },
      },
      messages: {
        include: {
          sender: { select: { id: true, name: true, email: true, role: true } },
          attachments: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  console.log("[Communication] Conversation retrieval:", {
    applicationId,
    conversationFound: !!conversation,
    conversationId: conversation?.id,
    messageCount: conversation?.messages.length || 0,
    userId
  });

  if (!conversation) {
    conversation = await prisma.caseConversation.create({
      data: {
        applicationId,
        subject: `Case ${application.id.slice(0, 8)}`,
        lastMessageAt: new Date(),
      },
      include: {
        propertyInterest: {
          include: {
            programProperty: {
              include: {
                property: {
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    address: true,
                    city: true,
                    state: true,
                    zip: true,
                    rent: true,
                    rentMax: true,
                    bedrooms: true,
                    bathrooms: true,
                    sqft: true,
                    amenities: true,
                    images: { select: { id: true, url: true, altText: true } },
                    units: { where: { available: true }, select: { id: true, beds: true, price: true, available: true } },
                  },
                },
              },
            },
          },
        },
        messages: {
          include: {
            sender: { select: { id: true, name: true, email: true, role: true } },
            attachments: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    
    console.log("[Communication] Created new conversation for retrieval:", {
      conversationId: conversation.id,
      applicationId
    });
  }

  const propertyInterest = conversation.propertyInterest ?? await prisma.applicantPropertyInterest.findFirst({
    where: {
      programApplicationId: applicationId,
      status: "INTERESTED",
    },
    orderBy: { createdAt: "desc" },
    include: {
      programProperty: {
        include: {
          property: {
            select: {
              id: true,
              title: true,
              description: true,
              address: true,
              city: true,
              state: true,
              zip: true,
              rent: true,
              rentMax: true,
              bedrooms: true,
              bathrooms: true,
              sqft: true,
              amenities: true,
              images: { select: { id: true, url: true, altText: true } },
              units: { where: { available: true }, select: { id: true, beds: true, price: true, available: true } },
            },
          },
        },
      },
    },
  });

  // Load application events
  const events = await prisma.applicationEvent.findMany({
    where: { applicationId },
    orderBy: { createdAt: "asc" },
    include: {
      actor: { select: { id: true, name: true, role: true } },
    },
  });

  // Load document requests
  const documentRequests = await prisma.documentRequest.findMany({
    where: { applicationId },
    orderBy: { requestedAt: "desc" },
    include: {
      requestedByUser: { select: { id: true, name: true } },
    },
  });

  // Load staff notes (only if user is staff)
  let staffNotes: any[] = [];
  if (isStaff) {
    staffNotes = await prisma.staffNote.findMany({
      where: { applicationId },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });
  }

  // Build merged timeline
  const timelineItems: any[] = [];

  // Add messages
  conversation.messages.forEach((msg: any) => {
    timelineItems.push({
      type: "message",
      id: msg.id,
      timestamp: msg.createdAt,
      senderId: msg.senderId,
      senderName: msg.sender.name || msg.sender.email,
      senderRole: msg.senderRole,
      content: msg.content,
      read: msg.read,
      readAt: msg.readAt,
      attachments: msg.attachments || [],
      metadata: {
        read: msg.read,
        attachments: msg.attachments || [],
      },
    });
  });

  // Add application events
  events.forEach((event: any) => {
    timelineItems.push({
      type: "event",
      id: event.id,
      timestamp: event.createdAt,
      eventType: event.type,
      actorName: event.actor?.name,
      metadata: event.metadata,
      description: formatEventDescription(event.type, event.metadata, event.fromStatus, event.toStatus),
    });
  });

  // Add document requests
  documentRequests.forEach((dr: any) => {
    timelineItems.push({
      type: "document",
      id: dr.id,
      timestamp: dr.requestedAt,
      documentType: dr.documentType,
      status: dr.status,
      expiresAt: dr.expiresAt,
      requestedBy: dr.requestedByUser?.name,
      metadata: {
        fileName: dr.fileUrl ? dr.fileUrl.split("/").pop() : null,
        status: dr.status,
      },
    });
  });

  // Add staff notes (only visible to staff)
  if (isStaff) {
    staffNotes.forEach((note: any) => {
      timelineItems.push({
        type: "message",
        id: note.id,
        timestamp: note.createdAt,
        senderId: note.authorId,
        senderName: note.author.name || "Staff",
        senderRole: "staff",
        content: note.content,
        messageType: "internal_note",
        read: true,
        metadata: {
          isInternalNote: true,
        },
      });
    });
  }

  // Sort chronologically
  timelineItems.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Calculate unread count
  const unreadMessages = conversation.messages.filter(
    (m: any) => !m.read && m.sender.id !== userId
  );

  return {
    applicationId,
    conversationId: conversation.id,
    applicantName: application.user.name,
    applicantEmail: application.user.email,
    programName: application.program.name,
    organizationName: application.program.organization.name,
    property: propertyInterest?.programProperty.property
      ? {
          ...propertyInterest.programProperty.property,
          programPropertyId: propertyInterest.programProperty.id,
        }
      : null,
    status: application.status,
    assignedTo: application.assignedTo,

    timeline: timelineItems,
    messageCount: conversation.messages.length,
    unreadCount: unreadMessages.length,
    pendingDocuments: documentRequests.filter((dr) => dr.status === "pending").length,
    lastMessageAt: conversation.lastMessageAt,
  };
}

/**
 * Send a message in case conversation
 */
export function getCaseMessageEventName(isApplicant: boolean) {
  return isApplicant ? "admin_action" : "message_created" as const;
}

export function buildCaseMessageNotificationPayload(payload: {
  userId: string;
  recipientId: string;
  recipientEmail: string;
  recipient: string;
  applicantName?: string;
  staffName?: string;
  applicationId: string;
  programId: string;
  organizationId: string;
  programName?: string;
  messagePreview?: string;
}) {
  return payload;
}

export async function sendCaseMessage(
  applicationId: string,
  senderId: string,
  scope: CommunicationScope,
  content: string,
  options?: {
    messageType?: MessageType;
    attachmentIds?: string[];
    senderIdentityId?: string;
  }
) {
  if (process.env.NODE_ENV !== "production") {
    console.log("[Communication] sendCaseMessage called:", {
      applicationId,
      senderId,
      contentLength: content.length,
      messageType: options?.messageType
    });
  }

  // Verify application and access
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: {
      program: { include: { organization: true } },
      user: true,
      assignedTo: true,
    },
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[Communication] Application lookup:", {
      applicationId,
      found: !!application,
      programOrgId: application?.program?.organization?.id,
    });
  }

  if (!application) {
    console.error("[Communication] ✗ APPLICATION_NOT_FOUND");
    throw new Error("APPLICATION_NOT_FOUND");
  }

  if (!canAccessOrganization(scope, application.program.organization.id)) {
    console.error("[Communication] ✗ ORGANIZATION_MISMATCH:", {
      applicationOrgId: application.program.organization.id,
    });
    throw new Error("ORGANIZATION_MISMATCH");
  }

  // Get sender
  const sender = await prisma.user.findUnique({ where: { id: senderId } });
  
  if (process.env.NODE_ENV !== "production") {
    console.log("[Communication] Sender lookup:", {
      senderId,
      found: !!sender,
      senderRole: sender?.role
    });
  }

  if (!sender) {
    console.error("[Communication] ✗ SENDER_NOT_FOUND");
    throw new Error("SENDER_NOT_FOUND");
  }

  // Verify access
  const isApplicant = sender.id === application.userId;
  if (process.env.NODE_ENV !== "production") {
    console.log("[Communication] Access check:", {
      isApplicant,
      senderId: sender.id,
      applicationUserId: application.userId
    });
  }

  if (!isApplicant) {
    console.log("[Communication] Staff user verified through caller authorization");
  } else {
    if (application.userId !== sender.id) {
      console.error("[Communication] ✗ UNAUTHORIZED: Applicant mismatch");
      throw new Error("UNAUTHORIZED");
    }
    console.log("[Communication] ✓ Applicant verified");
  }

  // Get or create conversation
  let conversation = await prisma.caseConversation.findUnique({
    where: { applicationId },
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[Communication] Conversation lookup:", {
      applicationId,
      conversationFound: !!conversation,
      conversationId: conversation?.id
    });
  }

  if (!conversation) {
    conversation = await prisma.caseConversation.create({
      data: {
        applicationId,
        subject: `Case ${application.id.slice(0, 8)}`,
        lastMessageAt: new Date(),
      },
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("[Communication] Created new conversation:", {
        conversationId: conversation.id,
        applicationId
      });
    }
  }

  // Determine sender role
  const senderRole = isApplicant ? "applicant" : "staff";

  // Create message
  const message = await prisma.caseMessage.create({
    data: {
      conversationId: conversation.id,
      senderId,
      senderRole,
      content,
      read: false,
    },
    include: {
      sender: { select: { id: true, name: true, email: true, role: true } },
      attachments: true,
    },
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[Communication] Message created in database:", {
      messageId: message.id,
      conversationId: conversation.id,
      senderId,
      senderRole,
      contentLength: content.length,
      timestamp: new Date().toISOString()
    });
  }

  // Update conversation lastMessageAt
  await prisma.caseConversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      lastMessageFrom: senderId,
    },
  });

  // Create application event for audit
  await prisma.applicationEvent.create({
    data: {
      applicationId,
      type: "message_sent",
      actorId: senderId,
      metadata: {
        messageId: message.id,
        messageType: options?.messageType || MessageType.NORMAL,
        senderRole,
        contentPreview: content.substring(0, 100),
      },
    },
  });

  // Determine recipient
  const recipientId = isApplicant
    ? application.assignedToId || application.program.createdBy
    : application.userId;

  if (recipientId) {
      const recipient = await prisma.user.findUnique({ where: { id: recipientId } });

      if (recipient) {
        const payload = buildCaseMessageNotificationPayload({
          userId: recipientId,
          recipientId,
          recipientEmail: recipient.email,
          recipient: recipient.email,
          applicantName: application.user.name || application.user.email,
          staffName: sender.name || sender.email,
          applicationId,
          programId: application.program.id,
          organizationId: application.program.organization.id,
          programName: application.program.name,
          messagePreview: content.substring(0, 150),
        });

        const domainEventName = isApplicant ? "admin.action" : "message.created";
        publishDomainEvent(domainEventName, payload);
      }
    }
  // Update application activity
  await prisma.programApplication.update({
    where: { id: applicationId },
    data: { lastActivityAt: new Date() },
  });

  return message;
}

export async function sendPropertyInterestMessage(
  applicationId: string,
  propertyInterestId: string,
  propertyTitle: string,
  senderId: string,
  scope: CommunicationScope
) {
  const conversation = await getOrCreateConversation(applicationId, senderId, scope);
  await prisma.caseConversation.update({
    where: { id: conversation.id },
    data: {
      propertyInterestId,
      subject: `Property interest: ${propertyTitle}`,
    },
  });

  const content = `Thank you for letting us know that you're interested in ${propertyTitle}.\n\nWe've received your request and a member of the HELOCI team will review the property details with your approved program and follow up with you here.\n\nIf you have questions about the property, availability, or next steps, you can reply to this conversation at any time.`;
  const existingMessage = await prisma.caseMessage.findFirst({
    where: { conversationId: conversation.id, content },
    select: { id: true },
  });

  if (!existingMessage) {
    await sendCaseMessage(applicationId, senderId, scope, content, {
      messageType: MessageType.SYSTEM_NOTIFICATION,
    });
  }

  return conversation.id;
}

/**
 * Create internal staff note (NEVER shown to applicants)
 */
export async function createInternalNote(
  applicationId: string,
  authorId: string,
  scope: CommunicationScope,
  content: string,
  options?: {
    tags?: string[];
  }
) {
  // Verify application access
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: { program: { include: { organization: true } } },
  });

  if (!application) throw new Error("APPLICATION_NOT_FOUND");
  if (!canAccessOrganization(scope, application.program.organization.id)) {
    throw new Error("ORGANIZATION_MISMATCH");
  }

  // STAFF ONLY

  // Create staff note
  const note = await prisma.staffNote.create({
    data: {
      applicationId,
      authorId,
      content,
      tags: options?.tags || [],
    },
    include: { author: true },
  });

  // Create audit event
  await prisma.applicationEvent.create({
    data: {
      applicationId,
      type: "internal_note_added",
      actorId: authorId,
      metadata: {
        noteId: note.id,
        contentPreview: content.substring(0, 100),
        tags: options?.tags,
      },
    },
  });

  return note;
}

/**
 * Request documents via case message
 */
export async function requestDocumentsInCase(
  applicationId: string,
  requesterUserId: string,
  scope: CommunicationScope,
  documentTypes: string[],
  options?: {
    dueDate?: Date;
    priority?: "low" | "medium" | "high";
    notes?: string;
    message?: string;
  }
) {
  // Verify application access
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: {
      program: { include: { organization: true } },
      user: true,
    },
  });

  if (!application) throw new Error("APPLICATION_NOT_FOUND");
  if (!canAccessOrganization(scope, application.program.organization.id)) {
    throw new Error("ORGANIZATION_MISMATCH");
  }

  // STAFF ONLY

  // Set default expiration (7 days)
  const expiresAt = options?.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Create document requests
  const requests = await Promise.all(
    documentTypes.map((docType) =>
      prisma.documentRequest.create({
        data: {
          applicationId,
          documentType: docType,
          status: "pending",
          requestedBy: requesterUserId,
          expiresAt,
          notes: options?.notes,
        },
      })
    )
  );

  // Send message about document request
  const messageContent =
    options?.message ||
    `📄 Document Request: Please submit the following by ${expiresAt.toLocaleDateString()}:\n\n${documentTypes.map((dt) => `• ${dt}`).join("\n")}`;

  const message = await sendCaseMessage(
    applicationId,
    requesterUserId,
    scope,
    messageContent,
    { messageType: MessageType.DOCUMENT_REQUEST }
  );

  // Create event
  await prisma.applicationEvent.create({
    data: {
      applicationId,
      type: "documents_requested",
      actorId: requesterUserId,
      metadata: {
        documentCount: documentTypes.length,
        documentTypes,
        expiresAt: expiresAt.toISOString(),
        priority: options?.priority || "normal",
      },
    },
  });

  // Publish document request event for shared notification runtime
  publishDomainEvent("documents.requested", {
    userId: application.userId,
    recipientId: application.userId,
    recipientEmail: application.user.email,
    applicationId,
    programId: application.program.id,
    organizationId: application.program.organization.id,
    programName: application.program.name,
    documentCount: documentTypes.length,
    expiresAt: expiresAt.toISOString(),
    messagePreview: messageContent.substring(0, 150)
  });

  return { message, requests };
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  applicationId: string,
  userId: string,
  scope: CommunicationScope
) {
  // Verify application access
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: { program: { include: { organization: true } }, caseConversation: true },
  });

  if (!application) throw new Error("APPLICATION_NOT_FOUND");
  if (!canAccessOrganization(scope, application.program.organization.id)) {
    throw new Error("ORGANIZATION_MISMATCH");
  }

  if (!application.caseConversation) return;

  // Mark all messages from others as read
  await prisma.caseMessage.updateMany({
    where: {
      conversationId: application.caseConversation.id,
      senderId: { not: userId },
      read: false,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });

  // Update conversation read status
  const isApplicant = userId === application.userId;
  if (isApplicant) {
    await prisma.caseConversation.update({
      where: { id: application.caseConversation.id },
      data: {
        applicantRead: true,
        applicantReadAt: new Date(),
      },
    });
  } else {
    await prisma.caseConversation.update({
      where: { id: application.caseConversation.id },
      data: {
        staffRead: true,
        staffReadAt: new Date(),
      },
    });
  }
}

/**
 * Update application status (with audit trail)
 */
export async function updateApplicationStatus(
  applicationId: string,
  newStatus: string,
  staffUserId: string,
  scope: CommunicationScope,
  options?: {
    reason?: string;
    notifyApplicant?: boolean;
  }
) {
  // Verify application access
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: {
      program: { include: { organization: true } },
      user: true,
    },
  });

  if (!application) throw new Error("APPLICATION_NOT_FOUND");
  if (!canAccessOrganization(scope, application.program.organization.id)) {
    throw new Error("ORGANIZATION_MISMATCH");
  }

  // STAFF ONLY

  const oldStatus = application.status;

  // Update status
  const updated = await prisma.programApplication.update({
    where: { id: applicationId },
    data: { status: newStatus, lastActivityAt: new Date() },
    include: { user: true, program: true },
  });

  // Create audit event
  await prisma.applicationEvent.create({
    data: {
      applicationId,
      type: "status_changed",
      actorId: staffUserId,
      fromStatus: oldStatus,
      toStatus: newStatus,
      metadata: {
        reason: options?.reason,
      },
    },
  });

  // Post to conversation
  const statusMessage = `📊 Status Update: Application status changed from "${oldStatus}" to "${newStatus}"${options?.reason ? `\n\nReason: ${options.reason}` : ""}`;

  await sendCaseMessage(
    applicationId,
    staffUserId,
    scope,
    statusMessage,
    { messageType: MessageType.STATUS_UPDATE }
  );

  // Notify applicant if requested
  if (options?.notifyApplicant) {
    const payload = {
      userId: application.userId,
      recipientEmail: application.user.email,
      applicationId,
      programName: application.program.name,
      applicationStatus: newStatus,
      reason: options?.reason,
    };

    if (newStatus === "approved") {
      publishDomainEvent("application.approved", payload);
    } else if (newStatus === "rejected") {
      publishDomainEvent("application.rejected", payload);
    } else {
      publishDomainEvent("admin.action", payload);
    }
  }

  return updated;
}

/**
 * Get unread count for a user across all applications
 */
export async function getUnreadCount(userId: string, scope: CommunicationScope) {
  const operationOrganizationId = getOperationOrganizationId(scope);
  if (!operationOrganizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  const scopeFilter = getScopeFilter(scope, "program.organizationId");

  const conversations = await prisma.caseConversation.findMany({
    where: {
      programApplication: {
        ...scopeFilter,
      },
    },
    include: {
      messages: {
        where: {
          senderId: { not: userId },
          read: false,
        },
      },
    },
  });

  return conversations.reduce((total, conv) => total + conv.messages.length, 0);
}

/**
 * Search messages
 */
export async function searchMessages(
  userId: string,
  scope: CommunicationScope,
  query: string
) {
  const operationOrganizationId = getOperationOrganizationId(scope);
  if (!operationOrganizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  const scopeFilter = getScopeFilter(scope, "program.organizationId");

  const conversations = await prisma.caseConversation.findMany({
    where: {
      programApplication: {
        ...scopeFilter,
      },
    },
    include: {
      messages: {
        where: {
          content: {
            contains: query,
            mode: "insensitive",
          },
        },
        include: {
          sender: { select: { id: true, name: true, role: true } },
        },
        take: 50,
      },
      programApplication: {
        select: {
          id: true,
          user: { select: { name: true, email: true } },
          program: { select: { name: true } },
        },
      },
    },
  });

  const results: any[] = [];
  conversations.forEach((conv) => {
    conv.messages.forEach((msg: any) => {
      results.push({
        applicationId: conv.programApplication.id,
        applicantName: conv.programApplication.user.name,
        programName: conv.programApplication.program.name,
        message: {
          id: msg.id,
          content: msg.content,
          senderName: msg.sender.name,
          senderRole: msg.senderRole,
          createdAt: msg.createdAt,
        },
      });
    });
  });

  return results;
}

/**
 * Format event description for UI
 */
function formatEventDescription(
  type: string,
  metadata?: any,
  fromStatus?: string | null,
  toStatus?: string | null
): string {
  switch (type) {
    case "message_sent":
      return `Message sent: ${metadata?.contentPreview || ""}`;
    case "status_changed":
      return `Status changed from "${fromStatus}" to "${toStatus}"`;
    case "documents_requested":
      return `${metadata?.documentCount || 0} document(s) requested`;
    case "document_uploaded":
      return `Document uploaded: ${metadata?.fileName || ""}`;
    case "internal_note_added":
      return `Internal staff note added`;
    case "assignment_changed":
      return `Case assigned to ${metadata?.assignedToName || "staff"}`;
    default:
      return type.replace(/_/g, " ");
  }
}

/**
 * Get conversation list for staff
 */
export async function getStaffConversationList(
  userId: string,
  scope: CommunicationScope,
  filters?: {
    search?: string;
    unreadOnly?: boolean;
    page?: number;
    pageSize?: number;
  }
) {
  const pageSize = filters?.pageSize ?? 20;
  const page = filters?.page ?? 1;
  const skip = (page - 1) * pageSize;

  const operationOrganizationId = getOperationOrganizationId(scope);
  if (!operationOrganizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  const scopeFilter = getScopeFilter(scope, "program.organizationId");

  const where: any = {
    ...scopeFilter,
  };

  if (filters?.search) {
    where.OR = [
      { user: { name: { contains: filters.search, mode: "insensitive" } } },
      { user: { email: { contains: filters.search, mode: "insensitive" } } },
      { program: { name: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  const [applications, total] = await Promise.all([
    prisma.programApplication.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        program: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        caseConversation: {
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { lastActivityAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.programApplication.count({ where }),
  ]);

  const conversations = applications.map((app) => {
    const lastMessage = app.caseConversation?.messages[0];
    const unreadCount = app.caseConversation?.messages.filter(
      (m: any) => !m.read && m.senderId !== userId
    ).length || 0;

    return {
      applicationId: app.id,
      conversationId: app.caseConversation?.id,
      applicantName: app.user.name,
      applicantEmail: app.user.email,
      programName: app.program.name,
      status: app.status,
      assignedTo: app.assignedTo?.name || "Unassigned",
      messageCount: app.caseConversation?.messages.length || 0,
      unreadCount,
      lastActivityAt: app.lastActivityAt,
      lastMessagePreview: lastMessage?.content.substring(0, 100) || "No messages",
    };
  });

  if (filters?.unreadOnly) {
    return {
      conversations: conversations.filter((c) => c.unreadCount > 0),
      total: conversations.filter((c) => c.unreadCount > 0).length,
      page,
      pageSize,
      totalPages: Math.ceil(conversations.filter((c) => c.unreadCount > 0).length / pageSize),
    };
  }

  return {
    conversations,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get applicant-side conversations for the current user.
 */
export async function getApplicantConversationsForUser(
  userId: string,
  scope?: CommunicationScope
) {
  const scopeFilter = scope ? getScopeFilter(scope, "program.organizationId") : {};

  const applications = await prisma.programApplication.findMany({
    where: {
      userId,
      ...scopeFilter,
    },
    include: {
      program: {
        include: { organization: true },
      },
      caseConversation: {
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { lastActivityAt: "desc" },
  });

  return applications.map((app) => ({
    applicationId: app.id,
    conversationId: app.caseConversation?.id,
    programName: app.program.name,
    organizationId: app.program.organizationId,
    organizationName: app.program.organization.name,
    status: app.status,
    messageCount: app.caseConversation?.messages.length || 0,
    lastMessageAt: app.caseConversation?.lastMessageAt || app.lastActivityAt,
    lastMessagePreview: app.caseConversation?.messages[0]?.content.substring(0, 100),
  }));
}

/**
 * Get all organization conversations for platform admin view.
 */
export async function getAdminOrganizationConversationOverview(
  userId: string,
  options?: {
    page?: number;
    pageSize?: number;
  }
) {
  const pageSize = options?.pageSize ?? 25;
  const page = options?.page ?? 1;
  const skip = (page - 1) * pageSize;

  const organizations = await prisma.organization.findMany({
    include: {
      programs: {
        include: {
          programApplications: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              program: { select: { id: true, name: true } },
              assignedTo: { select: { id: true, name: true } },
              caseConversation: {
                include: {
                  messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                  },
                },
              },
            },
            orderBy: { lastActivityAt: "desc" },
            take: pageSize,
            skip,
          },
        },
      },
    },
  });

  return organizations.map((org) => {
    const allConversations = org.programs.flatMap((prog) =>
      prog.programApplications.map((app) => {
        const lastMessage = app.caseConversation?.messages[0];
        const unreadCount = app.caseConversation?.messages.filter(
          (m: any) => !m.read && m.senderId !== userId
        ).length || 0;

        return {
          applicationId: app.id,
          conversationId: app.caseConversation?.id,
          applicantName: app.user.name,
          applicantEmail: app.user.email,
          programName: app.program.name,
          organizationId: org.id,
          status: app.status,
          assignedTo: app.assignedTo?.name || "Unassigned",
          messageCount: app.caseConversation?.messages.length || 0,
          unreadCount,
          lastActivityAt: app.lastActivityAt,
          lastMessagePreview: lastMessage?.content.substring(0, 100) || "No messages",
        };
      })
    );

    const unreadCount = allConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

    return {
      organizationId: org.id,
      organizationName: org.name,
      conversations: allConversations,
      unreadCount,
    };
  });
}

/**
 * Persist organization email records in the service layer.
 */
export async function createOrganizationEmailRecord(
  organizationId: string,
  senderId: string,
  senderIdentityId: string,
  subject: string,
  content: string,
  recipients: Array<{ id?: string; email: string; name?: string }>,
  attachments?: string[]
) {
  const created = await prisma.organizationCommunication.create({
    data: {
      organizationId,
      senderId,
      senderIdentityId,
      subject,
      content,
      messageType: "email",
      status: "sent",
      recipients: {
        create: recipients.map((r) => ({
          email: r.email,
          name: r.name || undefined,
          status: "pending",
        })),
      },
      metadata: {
        attachments: attachments || [],
        source: "communication_hub",
      },
    },
    include: {
      recipients: true,
    },
  });

  await Promise.all(
    recipients.map(async (recipient) => {
      try {
        // PHASE B.6 CANONICALIZATION FIX:
        // Previously called notificationService.notify("custom_email",...) which is an undocumented event
        // not in the Communication Registry. Now we publish the domain event instead.
        // The NotificationDomainSubscriber will map "admin.action" → "admin_action" communication event
        // and call notificationService.notify() via the canonical path.
        publishDomainEvent("admin.action", {
          userId: senderId,
          recipientEmail: recipient.email,
          recipient: recipient.email,
          userEmail: recipient.email,
          organizationId,
          senderIdentityId,
          sender: senderIdentityId,
          title: subject,
          body: content,
          content,
          name: recipient.name,
        });

        await prisma.organizationCommunicationRecipient.updateMany({
          where: {
            communicationId: created.id,
            email: recipient.email,
          },
          data: {
            status: "delivered",
            deliveredAt: new Date(),
          },
        });
      } catch (error) {
        await prisma.organizationCommunicationRecipient.updateMany({
          where: {
            communicationId: created.id,
            email: recipient.email,
          },
          data: {
            status: "failed",
          },
        });
      }
    })
  );

  return created;
}


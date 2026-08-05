/**
 * UNIFIED TIMELINE SERVICE - Phase 1.6 Polish
 * 
 * Single unified timeline merging:
 * - Internal Messages (CaseMessage)
 * - Emails Sent (NotificationLog)
 * - Document Requests (DocumentRequest)
 * - Staff Notes (StaffNote)
 * - Decisions (ApplicationEvent with type=decision)
 * - Status Changes (ApplicationEvent with type=status_change)
 * 
 * Returns chronological list with type info for rich rendering.
 * Reuses existing models - ZERO new infrastructure.
 */

import { prisma } from "@/lib/prisma/client";
import { CommunicationScope, getOperationOrganizationId } from "@/lib/communications/scope.service";

export type TimelineItemType = 
  | "internal_message"
  | "email_sent"
  | "email_received"
  | "document_request"
  | "document_uploaded"
  | "staff_note"
  | "decision"
  | "status_change"
  | "application_submitted";

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  timestamp: Date;
  actor: {
    id: string;
    name: string | null;
    email: string;
    role: "applicant" | "staff" | "admin" | "system";
  };
  content: string;
  metadata: {
    messageId?: string;
    notificationLogId?: string;
    documentRequestId?: string;
    staffNoteId?: string;
    applicationEventId?: string;
    status?: string;
    decisionStatus?: string;
    deliveryStatus?: string;
    documentType?: string;
    fileName?: string;
    senderIdentity?: {
      id: string;
      displayName: string;
      emailAddress: string;
      department?: string | null;
    };
  };
  read?: boolean;
  edited?: boolean;
  editedAt?: Date | null;
  deliveryStatus?: "sending" | "delivered" | "failed" | "pending";
}

/**
 * Get unified timeline for application
 * Merges all communication types into single chronological stream
 */
export async function getUnifiedTimeline(
  applicationId: string,
  userId: string,
  scope: CommunicationScope,
  options?: {
    page?: number;
    pageSize?: number;
  }
): Promise<{
  items: TimelineItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const organizationId = getOperationOrganizationId(scope);
  if (!organizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: {
      program: { select: { organizationId: true } },
      user: true,
      assignedTo: true
    }
  });

  if (!application) throw new Error("APPLICATION_NOT_FOUND");
  if (application.program.organizationId !== organizationId) {
    throw new Error("ORGANIZATION_MISMATCH");
  }

  const isApplicant = userId === application.userId;

  const pageSize = options?.pageSize ?? 50;
  const page = options?.page ?? 1;
  const skip = (page - 1) * pageSize;

  // Fetch all timeline sources in parallel
  const [messages, emails, documentRequests, staffNotes, applicationEvents] = await Promise.all([
    // Internal messages
    prisma.caseMessage.findMany({
      where: {
        conversation: {
          programApplication: { id: applicationId }
        }
      },
      include: {
        sender: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "desc" }
    }),

    // Emails (NotificationLog)
    prisma.notificationLog.findMany({
      where: {
        channel: "email",
        userId: { not: null }
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        senderIdentity: {
          select: {
            id: true,
            displayName: true,
            emailAddress: true,
            department: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),

    // Document requests
    prisma.documentRequest.findMany({
      where: {
        applicationId
      },
      include: {
        requestedByUser: { select: { id: true, name: true, email: true } }
      },
      orderBy: { requestedAt: "desc" }
    }),

    // Staff notes
    prisma.staffNote.findMany({
      where: {
        application: { id: applicationId }
      },
      include: {
        author: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "desc" }
    }),

    // Application events (decisions, status changes, submissions)
    prisma.applicationEvent.findMany({
      where: {
        applicationId
      },
      include: {
        actor: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  // Map to unified timeline items
  const items: TimelineItem[] = [];

  // Map messages
  messages.forEach(msg => {
    items.push({
      id: msg.id,
      type: "internal_message",
      timestamp: msg.createdAt,
      actor: {
        id: msg.sender.id,
        name: msg.sender.name,
        email: msg.sender.email,
        role: msg.senderRole === "applicant" ? "applicant" : "staff"
      },
      content: msg.content,
      metadata: { messageId: msg.id },
      read: msg.read,
      edited: msg.updatedAt > msg.createdAt,
      editedAt: msg.updatedAt
    });
  });

  // Map emails
  emails.forEach(email => {
    if (!email.user) return; // Skip if user is null
    
    const senderDisplay = email.senderIdentity 
      ? `${email.senderIdentity.displayName} <${email.senderIdentity.emailAddress}>`
      : email.sender || "System";
    
    items.push({
      id: email.id,
      type: "email_sent",
      timestamp: email.sentAt || email.createdAt,
      actor: {
        id: email.user.id,
        name: email.user.name,
        email: email.user.email,
        role: "staff"
      },
      content: `Email sent from ${senderDisplay} to ${email.recipient || "unknown"}: ${email.subject || "No subject"}`,
      metadata: {
        notificationLogId: email.id,
        deliveryStatus: email.deliveryStatus,
        senderIdentity: email.senderIdentity || undefined
      },
      deliveryStatus: mapNotificationDeliveryStatus(email.deliveryStatus)
    });
  });

  // Map document requests
  documentRequests.forEach(dr => {
    items.push({
      id: dr.id,
      type: "document_request",
      timestamp: dr.requestedAt,
      actor: {
        id: dr.requestedByUser.id,
        name: dr.requestedByUser.name,
        email: dr.requestedByUser.email,
        role: "staff"
      },
      content: `Document requested: ${dr.documentType}${dr.expiresAt ? ` (due ${dr.expiresAt.toLocaleDateString()})` : ""}`,
      metadata: {
        documentRequestId: dr.id,
        documentType: dr.documentType,
        status: dr.status
      }
    });
  });

  // Map staff notes (only visible to staff if not applicant)
  if (!isApplicant) {
    staffNotes.forEach(note => {
      items.push({
        id: note.id,
        type: "staff_note",
        timestamp: note.createdAt,
        actor: {
          id: note.author.id,
          name: note.author.name,
          email: note.author.email,
          role: "staff"
        },
        content: note.content,
        metadata: { staffNoteId: note.id },
        edited: note.updatedAt > note.createdAt,
        editedAt: note.updatedAt
      });
    });
  }

  // Map application events
  applicationEvents.forEach(event => {
    if (event.type === "application_submitted") {
      items.push({
        id: event.id,
        type: "application_submitted",
        timestamp: event.createdAt,
        actor: {
          id: event.actor?.id || "system",
          name: event.actor?.name || "System",
          email: event.actor?.email || "system@local",
          role: "applicant"
        },
        content: "Application submitted",
        metadata: { applicationEventId: event.id }
      });
    } else if (event.type === "decision") {
      const decision = event.metadata && typeof event.metadata === "object" && "decision" in event.metadata 
        ? String(event.metadata.decision)
        : "Unknown";
      items.push({
        id: event.id,
        type: "decision",
        timestamp: event.createdAt,
        actor: {
          id: event.actor?.id || "system",
          name: event.actor?.name || "System",
          email: event.actor?.email || "system@local",
          role: "staff"
        },
        content: `Decision: ${decision}`,
        metadata: {
          applicationEventId: event.id,
          decisionStatus: decision
        }
      });
    } else if (event.type === "status_change") {
      const newStatus = event.metadata && typeof event.metadata === "object" && "newStatus" in event.metadata 
        ? String(event.metadata.newStatus)
        : "Unknown";
      items.push({
        id: event.id,
        type: "status_change",
        timestamp: event.createdAt,
        actor: {
          id: event.actor?.id || "system",
          name: event.actor?.name || "System",
          email: event.actor?.email || "system@local",
          role: "staff"
        },
        content: `Status changed to ${newStatus}`,
        metadata: {
          applicationEventId: event.id,
          status: newStatus
        }
      });
    }
  });

  // Sort by timestamp descending, then take page
  const sorted = items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const paginated = sorted.slice(skip, skip + pageSize);

  return {
    items: paginated,
    total: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize)
  };
}

/**
 * Map Prisma delivery status to UI status
 */
function mapNotificationDeliveryStatus(status: string): "sending" | "delivered" | "failed" | "pending" {
  switch (status) {
    case "SENT":
    case "DELIVERED":
    case "READ":
      return "delivered";
    case "FAILED":
      return "failed";
    case "QUEUED":
      return "sending";
    default:
      return "pending";
  }
}

/**
 * Get timeline item with full context for detail view
 */
export async function getTimelineItemDetail(
  itemId: string
) {
  // Try to find in different models
  const caseMessage = await prisma.caseMessage.findUnique({
    where: { id: itemId },
    include: { sender: true, conversation: true }
  });

  if (caseMessage) {
    return {
      type: "internal_message",
      data: caseMessage
    };
  }

  const notificationLog = await prisma.notificationLog.findUnique({
    where: { id: itemId },
    include: { user: true }
  });

  if (notificationLog) {
    return {
      type: "email",
      data: notificationLog
    };
  }

  const documentRequest = await prisma.documentRequest.findUnique({
    where: { id: itemId },
    include: { requestedByUser: true }
  });

  if (documentRequest) {
    return {
      type: "document_request",
      data: documentRequest
    };
  }

  throw new Error("ITEM_NOT_FOUND");
}

import { prisma } from "@/lib/prisma/client";
import { documentStorageService } from "@/lib/documents/storage.service";
import { notificationService } from "@/lib/notifications/notification.service";
import { publishDomainEvent } from "@/lib/events/domain-event-publisher";

export interface UserDocumentSummary {
  id: string;
  fileName: string;
  fileUrl: string;
  type: string;
  uploadedAt: Date;
}

export async function listDocumentsForUser(userId: string): Promise<UserDocumentSummary[]> {
  const documents = await prisma.document.findMany({
    where: {
      uploaderId: userId,
    },
    orderBy: {
      uploadedAt: "desc",
    },
    select: {
      id: true,
      fileName: true,
      fileUrl: true,
      type: true,
      uploadedAt: true,
    },
  });

  return documents;
}

export async function getDocumentForUser(documentId: string, userId: string) {
  const document = await prisma.document.findUnique({ where: { id: documentId } });

  if (!document) {
    throw new Error("Document not found");
  }

  if (document.uploaderId !== userId) {
    throw new Error("Unauthorized");
  }

  return document;
}

export async function deleteDocumentForUser(documentId: string, userId: string) {
  const document = await getDocumentForUser(documentId, userId);

  await documentStorageService.delete(document.fileUrl);

  await prisma.document.delete({ where: { id: documentId } });

  return { success: true as const };
}

export async function uploadDocumentForApplication(input: {
  userId: string;
  applicationId: string;
  documentType: string;
  category?: string;
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}) {
  const application = await prisma.programApplication.findUnique({
    where: { id: input.applicationId },
  });

  if (!application || application.userId !== input.userId) {
    throw new Error("Application not found");
  }

  const uploadedDoc = await documentStorageService.upload(
    input.buffer,
    input.fileName,
    input.mimeType,
    {
      userId: input.userId,
      applicationId: input.applicationId,
      category: input.category || "general",
      documentType: input.documentType,
    }
  );

  const existing = await prisma.document.findFirst({
    where: {
      uploaderId: input.userId,
      type: input.documentType,
      programApplicationId: input.applicationId,
    },
  });

  const existingAlt = existing || (await prisma.document.findFirst({
    where: {
      uploaderId: input.userId,
      type: input.documentType,
      applicationId: input.applicationId,
    },
  }));

  let document;
  if (existingAlt) {
    await documentStorageService.delete(existingAlt.fileUrl);

    document = await prisma.document.update({
      where: { id: existingAlt.id },
      data: {
        fileName: uploadedDoc.fileName,
        fileUrl: uploadedDoc.fileUrl,
        uploadedAt: uploadedDoc.uploadedAt,
      },
    });
  } else {
    document = await prisma.document.create({
      data: {
        fileName: uploadedDoc.fileName,
        fileUrl: uploadedDoc.fileUrl,
        type: input.documentType,
        uploaderId: input.userId,
        programApplicationId: input.applicationId,
      },
    });
  }

  return {
    id: document.id,
    fileName: document.fileName,
    fileUrl: document.fileUrl,
    type: document.type,
    uploadedAt: document.uploadedAt,
    size: uploadedDoc.size,
  };
}

export async function getDocumentOrganizationId(documentId: string): Promise<string | null> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      programApplication: {
        select: {
          program: {
            select: { organizationId: true },
          },
        },
      },
    },
  });

  return document?.programApplication?.program.organizationId ?? null;
}

export async function getDocumentAuditHistory(documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      programApplication: {
        include: {
          program: {
            select: { id: true, name: true, organizationId: true },
          },
        },
      },
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  if (!document.programApplication) {
    throw new Error("Invalid document state");
  }

  const applicationId = document.programApplicationId || "";

  const [events, auditLogs] = await Promise.all([
    prisma.applicationEvent.findMany({
      where: {
        applicationId,
        OR: [
          { type: { contains: "document" } },
          {
            metadata: {
              path: ["documentId"],
              equals: documentId,
            },
          },
        ],
      },
      include: {
        actor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.findMany({
      where: {
        entity: "DocumentVerification",
        meta: {
          path: ["documentId"],
          equals: documentId,
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const history = [
    ...events.map((event) => ({
      id: event.id,
      type: event.type,
      action: formatEventType(event.type),
      timestamp: event.createdAt,
      actor: {
        id: event.actor?.id || null,
        name: event.actor?.name || "System",
        email: event.actor?.email || null,
        role: "staff",
        organization: null,
      },
      metadata: event.metadata as any,
      source: "event" as const,
    })),
    ...auditLogs.map((log) => ({
      id: log.id,
      type: log.action,
      action: formatAuditAction(log.action),
      timestamp: log.createdAt,
      actor: {
        id: log.user?.id || null,
        name: log.user?.name || "System",
        email: log.user?.email || null,
        role: "staff",
        organization: null,
      },
      metadata: log.meta as any,
      source: "audit" as const,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .filter((item, index, arr) => {
      if (item.source === "audit") {
        const hasEvent = arr.some(
          (other, otherIndex) =>
            other.source === "event" &&
            Math.abs(new Date(other.timestamp).getTime() - new Date(item.timestamp).getTime()) < 1000 &&
            other.type.includes(item.type)
        );
        return !hasEvent;
      }
      return true;
    });

  return {
    history,
    organizationId: document.programApplication.program.organizationId,
    document: {
      id: document.id,
      fileName: document.fileName,
      type: document.type,
      uploadedAt: document.uploadedAt,
    },
  };
}

export async function sendApplicantNoteForDocument(input: {
  documentId: string;
  userId: string;
  note: string;
  userName?: string | null;
}) {
  const document = await prisma.document.findUnique({
    where: { id: input.documentId },
    include: {
      programApplication: {
        include: {
          program: { select: { id: true, name: true, organizationId: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  if (!document.programApplication) {
    throw new Error("Invalid document state");
  }

  const applicationId = document.programApplicationId || "";

  let conversation = await prisma.caseConversation.findUnique({
    where: { applicationId },
  });

  if (!conversation) {
    conversation = await prisma.caseConversation.create({
      data: {
        applicationId,
        subject: `Documents for ${document.programApplication.program.name}`,
      },
    });
  }

  const message = await prisma.caseMessage.create({
    data: {
      conversationId: conversation.id,
      senderId: input.userId,
      senderRole: "staff",
      content: `**Note about ${document.type}** (${document.fileName})\n\n${input.note}`,
    },
  });

  await prisma.caseConversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      lastMessageFrom: input.userId,
      applicantRead: false,
    },
  });

  await prisma.applicationEvent.create({
    data: {
      applicationId,
      type: "staff_note_sent",
      actorId: input.userId,
      metadata: {
        documentId: input.documentId,
        documentType: document.type,
        fileName: document.fileName,
        notePreview: input.note.substring(0, 100),
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      entity: "CaseMessage",
      action: "sent_applicant_note",
      meta: {
        documentId: input.documentId,
        messageId: message.id,
        applicationId,
      },
    },
  });

  publishDomainEvent("message.created", {
    userId: document.programApplication.user.id,
    senderName: input.userName || "Staff",
    messagePreview: input.note.substring(0, 100),
    applicationId,
    conversationId: conversation.id,
  });

  return {
    success: true as const,
    message: "Note sent to applicant",
    conversationId: conversation.id,
    messageId: message.id,
  };
}

function formatEventType(type: string): string {
  const typeMap: Record<string, string> = {
    document_uploaded: "Document Uploaded",
    document_approved: "Document Approved",
    document_rejected: "Document Rejected",
    document_replacement_requested: "Replacement Requested",
    document_replaced: "Document Replaced",
    document_verified: "Document Verified",
  };
  return typeMap[type] || type.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function formatAuditAction(action: string): string {
  const actionMap: Record<string, string> = {
    approved: "Approved",
    rejected: "Rejected",
    replacement_requested: "Replacement Requested",
    note_added: "Note Added",
    marked_pending: "Marked as Pending",
  };
  return actionMap[action] || action.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

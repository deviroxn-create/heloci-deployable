import { prisma } from "@/lib/prisma/client";
import { publishDomainEvent } from "@/lib/events/domain-event-publisher";
import { documentStorageService } from "@/lib/documents/storage.service";

/**
 * Document Review Service
 * Manages document verification and review workflow for government-grade compliance
 */

export interface DocumentReviewDetail {
  // Document info
  id: string;
  fileName: string;
  fileUrl: string;
  type: string;
  uploadedAt: Date;
  uploadedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  
  // Verification info
  verification: {
    id: string | null;
    status: "pending" | "verified" | "rejected" | "needs_replacement";
    reviewedBy: string | null;
    reviewedByUser: { id: string; name: string | null } | null;
    reviewedAt: Date | null;
    notes: string | null;
    rejectionReason: string | null;
  } | null;
  
  // Metadata
  size?: number; // Future enhancement
  mimeType?: string; // Future enhancement
  version?: number; // Future enhancement
}

export interface BulkReviewResult {
  success: number;
  failed: number;
  errors: Array<{ documentId: string; error: string }>;
}

export async function getDocumentReviewContext(documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      programApplicationId: true,
      fileName: true,
      fileUrl: true,
      type: true,
      uploadedAt: true,
      programApplication: {
        select: {
          id: true,
          program: {
            select: { organizationId: true },
          },
        },
      },
    },
  });

  if (!document || !document.programApplication) {
    return null;
  }

  return {
    id: document.id,
    programApplicationId: document.programApplicationId,
    organizationId: document.programApplication.program.organizationId,
  };
}

export async function getBulkDocumentReviewContext(documentIds: string[]) {
  const documents = await prisma.document.findMany({
    where: { id: { in: documentIds } },
    select: {
      id: true,
      programApplicationId: true,
      programApplication: {
        select: {
          id: true,
          program: {
            select: { organizationId: true },
          },
        },
      },
    },
  });

  return documents.map((document) => ({
    id: document.id,
    programApplicationId: document.programApplicationId,
    organizationId: document.programApplication?.program.organizationId ?? null,
  }));
}

/**
 * Get all documents for an application with verification status
 */
export async function getApplicationDocuments(
  applicationId: string,
  staffUserId: string
): Promise<DocumentReviewDetail[]> {
  // Get application to verify org access
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: { program: true },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  // Get all documents for this application
  const documents = await prisma.document.findMany({
    where: { programApplicationId: applicationId },
    include: {
      uploader: {
        select: { id: true, name: true, email: true },
      },
      verification: {
        include: {
          reviewer: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { uploadedAt: "desc" },
  });

  return documents.map((doc) => ({
    id: doc.id,
    fileName: doc.fileName,
    fileUrl: documentStorageService.getViewUrl(doc.fileUrl, doc.id),
    type: doc.type,
    uploadedAt: doc.uploadedAt,
    uploadedBy: doc.uploader,
    verification: doc.verification
      ? {
          id: doc.verification.id,
          status: doc.verification.status as any,
          reviewedBy: doc.verification.reviewedBy,
          reviewedByUser: doc.verification.reviewer,
          reviewedAt: doc.verification.reviewedAt,
          notes: doc.verification.notes,
          rejectionReason: doc.verification.rejectionReason,
        }
      : null,
  }));
}

/**
 * Approve a document
 */
export async function approveDocument(
  documentId: string,
  staffUserId: string,
  notes?: string
): Promise<void> {
  // Get document with application
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      programApplication: {
        include: { program: true, user: true },
      },
    },
  });

  if (!document || !document.programApplication) {
    throw new Error("Document not found");
  }

  // Create or update verification record
  await prisma.documentVerification.upsert({
    where: { documentId },
    create: {
      documentId,
      status: "verified",
      reviewedBy: staffUserId,
      reviewedAt: new Date(),
      notes,
    },
    update: {
      status: "verified",
      reviewedBy: staffUserId,
      reviewedAt: new Date(),
      notes,
      rejectionReason: null, // Clear rejection reason
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: staffUserId,
      entity: "DocumentVerification",
      action: "approved",
      meta: {
        documentId,
        applicationId: document.programApplication.id,
        fileName: document.fileName,
        documentType: document.type,
      },
    },
  });

  // Create timeline event
  await prisma.applicationEvent.create({
    data: {
      applicationId: document.programApplication.id,
      type: "document_approved",
      actorId: staffUserId,
      metadata: {
        documentId,
        fileName: document.fileName,
        documentType: document.type,
      },
    },
  });

  publishDomainEvent("document.approved", {
    userId: document.programApplication.user.id,
    documentType: document.type,
    fileName: document.fileName,
    applicationId: document.programApplication.id,
  });
}

/**
 * Reject a document
 */
export async function rejectDocument(
  documentId: string,
  staffUserId: string,
  rejectionReason: string,
  notes?: string
): Promise<void> {
  if (!rejectionReason?.trim()) {
    throw new Error("Rejection reason is required");
  }

  // Get document with application
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      programApplication: {
        include: { program: true, user: true },
      },
    },
  });

  if (!document || !document.programApplication) {
    throw new Error("Document not found");
  }

  // Create or update verification record
  await prisma.documentVerification.upsert({
    where: { documentId },
    create: {
      documentId,
      status: "rejected",
      reviewedBy: staffUserId,
      reviewedAt: new Date(),
      rejectionReason,
      notes,
    },
    update: {
      status: "rejected",
      reviewedBy: staffUserId,
      reviewedAt: new Date(),
      rejectionReason,
      notes,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: staffUserId,
      entity: "DocumentVerification",
      action: "rejected",
      meta: {
        documentId,
        applicationId: document.programApplication.id,
        fileName: document.fileName,
        documentType: document.type,
        rejectionReason,
      },
    },
  });

  // Create timeline event
  await prisma.applicationEvent.create({
    data: {
      applicationId: document.programApplication.id,
      type: "document_rejected",
      actorId: staffUserId,
      metadata: {
        documentId,
        fileName: document.fileName,
        documentType: document.type,
        rejectionReason,
      },
    },
  });

  publishDomainEvent("document.rejected", {
    userId: document.programApplication.user.id,
    documentType: document.type,
    fileName: document.fileName,
    rejectionReason,
    applicationId: document.programApplication.id,
  });
}

/**
 * Request document replacement
 */
export async function requestDocumentReplacement(
  documentId: string,
  staffUserId: string,
  reason: string,
  deadline?: Date,
  instructions?: string
): Promise<void> {
  if (!reason?.trim()) {
    throw new Error("Replacement reason is required");
  }

  // Get document with application
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      programApplication: {
        include: { program: true, user: true },
      },
    },
  });

  if (!document || !document.programApplication) {
    throw new Error("Document not found");
  }

  // Update verification status
  await prisma.documentVerification.upsert({
    where: { documentId },
    create: {
      documentId,
      status: "needs_replacement",
      reviewedBy: staffUserId,
      reviewedAt: new Date(),
      rejectionReason: reason,
      notes: instructions,
    },
    update: {
      status: "needs_replacement",
      reviewedBy: staffUserId,
      reviewedAt: new Date(),
      rejectionReason: reason,
      notes: instructions,
    },
  });

  // Create document request for replacement
  const expiresAt = deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default

  // Get or create conversation for Communication Center integration
  let conversation = await prisma.caseConversation.findUnique({
    where: { applicationId: document.programApplication.id },
  });

  if (!conversation) {
    conversation = await prisma.caseConversation.create({
      data: {
        applicationId: document.programApplication.id,
        subject: `Documents for ${document.programApplication.program.name}`,
      },
    });
  }

  // Create message in Communication Center
  const message = await prisma.caseMessage.create({
    data: {
      conversationId: conversation.id,
      senderId: staffUserId,
      senderRole: "staff",
      content: `Document replacement requested for **${document.type}** (${document.fileName}).\n\n**Reason:** ${reason}${instructions ? `\n\n**Instructions:** ${instructions}` : ""}\n\n**Deadline:** ${expiresAt.toLocaleDateString()}\n\nPlease upload a replacement document by the deadline.`,
    },
  });

  // Create document request linked to message
  await prisma.documentRequest.create({
    data: {
      applicationId: document.programApplication.id,
      documentType: document.type,
      status: "pending",
      requestedBy: staffUserId,
      expiresAt,
      notes: `Replacement requested: ${reason}${instructions ? `\n\nInstructions: ${instructions}` : ""}`,
      messageId: message.id,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: staffUserId,
      entity: "DocumentVerification",
      action: "replacement_requested",
      meta: {
        documentId,
        applicationId: document.programApplication.id,
        fileName: document.fileName,
        documentType: document.type,
        reason,
        deadline: expiresAt,
      },
    },
  });

  // Create timeline event
  await prisma.applicationEvent.create({
    data: {
      applicationId: document.programApplication.id,
      type: "document_replacement_requested",
      actorId: staffUserId,
      metadata: {
        documentId,
        fileName: document.fileName,
        documentType: document.type,
        reason,
      },
    },
  });

  publishDomainEvent("document.replacement.requested", {
    userId: document.programApplication.user.id,
    documentType: document.type,
    fileName: document.fileName,
    reason,
    deadline: expiresAt,
    instructions,
    applicationId: document.programApplication.id,
  });
}

/**
 * Mark document as pending review
 */
export async function markDocumentPending(
  documentId: string,
  staffUserId: string
): Promise<void> {
  // Get document with application
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      programApplication: {
        include: { program: true },
      },
    },
  });

  if (!document || !document.programApplication) {
    throw new Error("Document not found");
  }

  // Update verification status
  await prisma.documentVerification.upsert({
    where: { documentId },
    create: {
      documentId,
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
    },
    update: {
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
      notes: null,
      rejectionReason: null,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: staffUserId,
      entity: "DocumentVerification",
      action: "marked_pending",
      meta: {
        documentId,
        applicationId: document.programApplication.id,
        fileName: document.fileName,
      },
    },
  });
}

/**
 * Add internal review note (not visible to applicant)
 */
export async function addInternalReviewNote(
  documentId: string,
  staffUserId: string,
  note: string
): Promise<void> {
  if (!note?.trim()) {
    throw new Error("Note is required");
  }

  // Get document with application
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      programApplication: {
        include: { program: true },
      },
      verification: true,
    },
  });

  if (!document || !document.programApplication) {
    throw new Error("Document not found");
  }

  // Add note to existing notes
  const existingNotes = document.verification?.notes || "";
  const timestamp = new Date().toISOString();
  const newNote = `[${timestamp}] ${note}`;
  const updatedNotes = existingNotes
    ? `${existingNotes}\n\n${newNote}`
    : newNote;

  // Update verification
  await prisma.documentVerification.upsert({
    where: { documentId },
    create: {
      documentId,
      status: document.verification?.status || "pending",
      notes: newNote,
    },
    update: {
      notes: updatedNotes,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: staffUserId,
      entity: "DocumentVerification",
      action: "note_added",
      meta: {
        documentId,
        applicationId: document.programApplication.id,
        fileName: document.fileName,
        note,
      },
    },
  });
}

/**
 * Bulk approve documents
 */
export async function bulkApproveDocuments(
  documentIds: string[],
  staffUserId: string,
  notes?: string
): Promise<BulkReviewResult> {
  const result: BulkReviewResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const documentId of documentIds) {
    try {
      await approveDocument(documentId, staffUserId, notes);
      result.success++;
    } catch (error: any) {
      result.failed++;
      result.errors.push({
        documentId,
        error: error.message || "Unknown error",
      });
    }
  }

  return result;
}

/**
 * Bulk reject documents
 */
export async function bulkRejectDocuments(
  documentIds: string[],
  staffUserId: string,
  rejectionReason: string,
  notes?: string
): Promise<BulkReviewResult> {
  const result: BulkReviewResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const documentId of documentIds) {
    try {
      await rejectDocument(documentId, staffUserId, rejectionReason, notes);
      result.success++;
    } catch (error: any) {
      result.failed++;
      result.errors.push({
        documentId,
        error: error.message || "Unknown error",
      });
    }
  }

  return result;
}

/**
 * Bulk request replacements
 */
export async function bulkRequestReplacements(
  documentIds: string[],
  staffUserId: string,
  reason: string,
  deadline?: Date,
  instructions?: string
): Promise<BulkReviewResult> {
  const result: BulkReviewResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const documentId of documentIds) {
    try {
      await requestDocumentReplacement(
        documentId,
        staffUserId,
        reason,
        deadline,
        instructions
      );
      result.success++;
    } catch (error: any) {
      result.failed++;
      result.errors.push({
        documentId,
        error: error.message || "Unknown error",
      });
    }
  }

  return result;
}

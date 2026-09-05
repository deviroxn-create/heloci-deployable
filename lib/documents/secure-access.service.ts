import { prisma } from "@/lib/prisma/client";
import { documentStorageService } from "@/lib/documents/storage.service";

/**
 * Secure Document Access Service
 * 
 * Provides enterprise-grade secure document delivery with:
 * - Authentication & Authorization
 * - Organization isolation
 * - Audit logging
 * - File integrity verification
 * - Rate limiting ready
 */

export interface DocumentAccessResult {
  allowed: boolean;
  document?: {
    id: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    size: number;
    applicationId: string;
    organizationId: string;
  };
  reason?: string;
  statusCode: number;
}

export interface FileIntegrityCheck {
  exists: boolean;
  sizeMatch: boolean;
  readable: boolean;
  path: string;
  data?: Buffer;
  actualSize: number;
  expectedSize: number;
}

/**
 * Validate document access permissions
 * 
 * Checks:
 * - User authentication
 * - Document exists
 * - RBAC permissions
 * - Organization isolation
 * - Application ownership (for applicants)
 */
export async function validateDocumentAccess(
  documentId: string,
  userId: string,
  userRole?: string,
  userOrganizationId?: string
): Promise<DocumentAccessResult> {
  try {
    // Get document with full context
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        programApplication: {
          include: {
            program: {
              select: {
                id: true,
                name: true,
                organizationId: true,
              },
            },
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        uploader: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      return {
        allowed: false,
        reason: "Document not found",
        statusCode: 404,
      };
    }

    if (!document.programApplication) {
      return {
        allowed: false,
        reason: "Invalid document state",
        statusCode: 500,
      };
    }

    const organizationId = document.programApplication.program.organizationId;
    const applicationOwnerId = document.programApplication.userId;

    // Platform Super Admin: Access to everything
    if (userRole === "SUPER_ADMIN") {
      return {
        allowed: true,
        document: {
          id: document.id,
          fileName: document.fileName,
          fileUrl: document.fileUrl,
          mimeType: document.mimeType || "application/octet-stream",
          size: document.size || 0,
          applicationId: document.programApplicationId || "",
          organizationId,
        },
        statusCode: 200,
      };
    }

    // Applicant: Can only access their own documents
    if (userRole === "applicant" || !userOrganizationId) {
      if (applicationOwnerId === userId) {
        return {
          allowed: true,
          document: {
            id: document.id,
            fileName: document.fileName,
            fileUrl: document.fileUrl,
            mimeType: document.mimeType || "application/octet-stream",
            size: document.size || 0,
            applicationId: document.programApplicationId || "",
            organizationId,
          },
          statusCode: 200,
        };
      } else {
        return {
          allowed: false,
          reason: "You can only access your own documents",
          statusCode: 403,
        };
      }
    }

    // Staff: Must be same organization
    if (userOrganizationId !== organizationId) {
      return {
        allowed: false,
        reason: "Access denied: Document belongs to different organization",
        statusCode: 403,
      };
    }

    // Authorization must be enforced at API / server-action layer.
    // At service level we already ensured organization consistency and ownership above.
    return {
      allowed: true,
      document: {
        id: document.id,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        mimeType: document.mimeType || "application/octet-stream",
        size: document.size || 0,
        applicationId: document.programApplicationId || "",
        organizationId,
      },
      statusCode: 200,
    };
  } catch (error: any) {
    console.error("Error validating document access:", error);
    return {
      allowed: false,
      reason: "Access validation failed",
      statusCode: 500,
    };
  }
}

/**
 * Download and verify a private storage object before serving.
 */
export async function verifyFileIntegrity(
  fileUrl: string,
  expectedSize?: number
): Promise<FileIntegrityCheck> {
  try {
    const objectKey = documentStorageService.getObjectKey(fileUrl);
    if (!objectKey) {
      throw new Error("Invalid document storage reference");
    }

    const data = await documentStorageService.download(fileUrl);
    const actualSize = data.length;
    const sizeMatch = expectedSize ? actualSize === expectedSize : true;

    return {
      exists: true,
      sizeMatch,
      readable: true,
      path: objectKey,
      actualSize,
      expectedSize: expectedSize || 0,
      data,
    };
  } catch (error: any) {
    console.error("Error verifying file integrity:", error);
    return {
      exists: false,
      sizeMatch: false,
      readable: false,
      path: "",
      actualSize: 0,
      expectedSize: expectedSize || 0,
    };
  }
}

/**
 * Log document access attempt
 * 
 * Creates audit log entry for every access attempt
 */
export async function logDocumentAccess(params: {
  userId: string;
  documentId: string;
  applicationId: string;
  organizationId: string;
  action: "download" | "preview";
  success: boolean;
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
  fileSize?: number;
  duration?: number;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        entity: "Document",
        action: params.action,
        meta: {
          documentId: params.documentId,
          applicationId: params.applicationId,
          organizationId: params.organizationId,
          success: params.success,
          failureReason: params.failureReason,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          fileSize: params.fileSize,
          duration: params.duration,
        },
      },
    });
  } catch (error) {
    console.error("Error logging document access:", error);
    // Don't throw - logging failure shouldn't block download
  }
}

/**
 * Get document access history
 * 
 * Returns list of all access attempts for a document
 */
export async function getDocumentAccessHistory(
  documentId: string,
  userId: string,
  organizationId: string,
  userRole?: string
): Promise<any[]> {
  try {
    // Verify user has access to view history
    const accessResult = await validateDocumentAccess(
      documentId,
      userId,
      userRole,
      organizationId
    );

    if (!accessResult.allowed) {
      throw new Error("Access denied");
    }

    // Get audit logs for this document
    const logs = await prisma.auditLog.findMany({
      where: {
        entity: "Document",
        action: { in: ["download", "preview"] },
        meta: {
          path: ["documentId"],
          equals: documentId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Limit to most recent 100
    });

    return logs.map((log) => ({
      id: log.id,
      user: {
        id: log.user?.id || null,
        name: log.user?.name || "Unknown",
        email: log.user?.email || null,
      },
      action: log.action,
      timestamp: log.createdAt,
      success: (log.meta as any)?.success || false,
      failureReason: (log.meta as any)?.failureReason || null,
      ipAddress: (log.meta as any)?.ipAddress || null,
      fileSize: (log.meta as any)?.fileSize || null,
      duration: (log.meta as any)?.duration || null,
    }));
  } catch (error) {
    console.error("Error getting document access history:", error);
    return [];
  }
}

/**
 * Get security headers for document response
 * 
 * Returns headers that enforce security best practices
 */
export function getSecurityHeaders(
  fileName: string,
  mimeType: string,
  forceDownload: boolean = true
): Record<string, string> {
  const sanitizedFileName = fileName.replace(/[^\w\s.-]/g, "_");

  return {
    "Content-Type": mimeType,
    "Content-Disposition": forceDownload
      ? `attachment; filename="${sanitizedFileName}"`
      : `inline; filename="${sanitizedFileName}"`,
    "Cache-Control": "private, no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'none'",
  };
}

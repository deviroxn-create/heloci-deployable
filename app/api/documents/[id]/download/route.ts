import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  validateDocumentAccess,
  verifyFileIntegrity,
  logDocumentAccess,
  getSecurityHeaders,
} from "@/lib/documents/secure-access.service";
import fs from "fs/promises";
import path from "path";

/**
 * Secure Document Download API
 * 
 * Enterprise-grade secure document delivery with:
 * - Authentication & Authorization
 * - Organization isolation
 * - Audit logging
 * - File integrity verification
 * - Security headers
 * 
 * GET /api/documents/[id]/download
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id: documentId } = await params;

  try {
    // 1. Authentication Check
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = user.id;
    const userRole = user.role;
    const userOrganizationId = user.organizationId;

    // 2. Authorization Check
    const accessResult = await validateDocumentAccess(
      documentId,
      userId,
      userRole,
      userOrganizationId || undefined
    );

    if (!accessResult.allowed) {
      // Log failed access attempt
      await logDocumentAccess({
        userId,
        documentId,
        applicationId: "unknown",
        organizationId: userOrganizationId || "unknown",
        action: "download",
        success: false,
        failureReason: accessResult.reason,
        duration: Date.now() - startTime,
      });

      return NextResponse.json(
        { error: accessResult.reason || "Access denied" },
        { status: accessResult.statusCode }
      );
    }

    const document = accessResult.document!;

    // 3. File Integrity Check
    const integrityCheck = await verifyFileIntegrity(
      document.fileUrl,
      document.size
    );

    if (!integrityCheck.exists) {
      await logDocumentAccess({
        userId,
        documentId,
        applicationId: document.applicationId,
        organizationId: document.organizationId,
        action: "download",
        success: false,
        failureReason: "File not found on disk",
        duration: Date.now() - startTime,
      });

      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    if (!integrityCheck.readable) {
      await logDocumentAccess({
        userId,
        documentId,
        applicationId: document.applicationId,
        organizationId: document.organizationId,
        action: "download",
        success: false,
        failureReason: "File not readable",
        duration: Date.now() - startTime,
      });

      return NextResponse.json(
        { error: "File cannot be accessed" },
        { status: 500 }
      );
    }

    if (!integrityCheck.sizeMatch && document.size) {
      console.warn("File size mismatch:", {
        documentId,
        expected: document.size,
        actual: integrityCheck.actualSize,
      });
      // Continue anyway, but log the discrepancy
    }

    // 4. Read File
    const fileBuffer = await fs.readFile(integrityCheck.path);

    // 5. Log Successful Access
    await logDocumentAccess({
      userId,
      documentId,
      applicationId: document.applicationId,
      organizationId: document.organizationId,
      action: "download",
      success: true,
      fileSize: fileBuffer.length,
      duration: Date.now() - startTime,
    });

    // 6. Prepare Security Headers
    const securityHeaders = getSecurityHeaders(
      document.fileName,
      document.mimeType,
      true // Force download
    );

    // 7. Return File with Security Headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        ...securityHeaders,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Error serving document download:", error);

    // Log error
    const user = await getCurrentUser();
    if (user?.id) {
      await logDocumentAccess({
        userId: user.id,
        documentId,
        applicationId: "unknown",
        organizationId: user.organizationId || "unknown",
        action: "download",
        success: false,
        failureReason: error.message || "Internal server error",
        duration: Date.now() - startTime,
      });
    }

    return NextResponse.json(
      { error: "Failed to download document" },
      { status: 500 }
    );
  }
}

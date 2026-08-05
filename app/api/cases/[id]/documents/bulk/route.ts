import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  bulkApproveDocuments,
  bulkRejectDocuments,
  bulkRequestReplacements,
} from "@/lib/reviews/document-review.service";
import { authorizeCaseWrite } from "@/lib/auth/case-authorization";
import { getBulkDocumentReviewContext } from "@/lib/reviews/document-review.service";

/**
 * POST /api/cases/[id]/documents/bulk
 * Bulk document review actions (approve, reject, request replacements)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, code: "UNAUTHORIZED", message: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id: applicationId } = await params;
    const body = await request.json();
    const { action, documentIds, reason, notes, deadline, instructions } = body;

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: "documentIds must be a non-empty array",
        },
        { status: 400 }
      );
    }

    const documents = await getBulkDocumentReviewContext(documentIds);

    if (documents.length !== documentIds.length) {
      return NextResponse.json(
        {
          success: false,
          code: "DOCUMENTS_NOT_FOUND",
          message: "One or more documents were not found",
        },
        { status: 404 }
      );
    }

    const invalidDocument = documents.find((doc) => doc.programApplicationId !== applicationId);
    if (invalidDocument) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_DOCUMENT_PATH",
          message: "One or more documents do not belong to the specified case",
        },
        { status: 400 }
      );
    }

    const firstDoc = documents[0];
    const organizationId = firstDoc?.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_DOCUMENT_STATE",
          message: "Unable to determine organization for documents",
        },
        { status: 400 }
      );
    }
    await authorizeCaseWrite(organizationId);

    let result;

    switch (action) {
      case "approve":
        result = await bulkApproveDocuments(documentIds, user.id, notes);
        break;

      case "reject":
        if (!reason) {
          return NextResponse.json(
            {
              success: false,
              code: "VALIDATION_ERROR",
              message: "Rejection reason is required for bulk reject",
            },
            { status: 400 }
          );
        }
        result = await bulkRejectDocuments(documentIds, user.id, reason, notes);
        break;

      case "request_replacement":
        if (!reason) {
          return NextResponse.json(
            {
              success: false,
              code: "VALIDATION_ERROR",
              message: "Replacement reason is required",
            },
            { status: 400 }
          );
        }
        const deadlineDate = deadline ? new Date(deadline) : undefined;
        result = await bulkRequestReplacements(
          documentIds,
          user.id,
          reason,
          deadlineDate,
          instructions
        );
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            code: "VALIDATION_ERROR",
            message: `Invalid bulk action: ${action}`,
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Bulk ${action} completed`,
        ...result,
      },
    });
  } catch (error: any) {
    console.error("[API] POST /api/cases/[id]/documents/bulk error:", error);
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: error.message || "Failed to process bulk action",
      },
      { status: 500 }
    );
  }
}

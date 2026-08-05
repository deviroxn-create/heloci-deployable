import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  approveDocument,
  rejectDocument,
  requestDocumentReplacement,
  markDocumentPending,
  addInternalReviewNote,
} from "@/lib/reviews/document-review.service";
import { authorizeCaseWrite } from "@/lib/auth/case-authorization";
import { getDocumentReviewContext } from "@/lib/reviews/document-review.service";

/**
 * POST /api/cases/[id]/documents/[docId]
 * Perform document review actions (approve, reject, request replacement, add note)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, code: "UNAUTHORIZED", message: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id: applicationId, docId: documentId } = await params;

    const documentContext = await getDocumentReviewContext(documentId);

    if (!documentContext) {
      return NextResponse.json(
        { success: false, code: "DOCUMENT_NOT_FOUND", message: "Document not found" },
        { status: 404 }
      );
    }

    if (documentContext.programApplicationId !== applicationId) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_DOCUMENT_PATH",
          message: "Document does not belong to the specified case",
        },
        { status: 400 }
      );
    }

    await authorizeCaseWrite(documentContext.organizationId);

    const body = await request.json();
    const { action, reason, notes, deadline, instructions } = body;

    // Handle different actions
    switch (action) {
      case "approve":
        await approveDocument(documentId, user.id, notes);
        return NextResponse.json({
          success: true,
          data: { message: "Document approved successfully" },
        });

      case "reject":
        if (!reason) {
          return NextResponse.json(
            {
              success: false,
              code: "VALIDATION_ERROR",
              message: "Rejection reason is required",
            },
            { status: 400 }
          );
        }
        await rejectDocument(documentId, user.id, reason, notes);
        return NextResponse.json({
          success: true,
          data: { message: "Document rejected successfully" },
        });

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
        await requestDocumentReplacement(
          documentId,
          user.id,
          reason,
          deadlineDate,
          instructions
        );
        return NextResponse.json({
          success: true,
          data: { message: "Document replacement requested successfully" },
        });

      case "mark_pending":
        await markDocumentPending(documentId, user.id);
        return NextResponse.json({
          success: true,
          data: { message: "Document marked as pending review" },
        });

      case "add_note":
        if (!notes) {
          return NextResponse.json(
            {
              success: false,
              code: "VALIDATION_ERROR",
              message: "Note is required",
            },
            { status: 400 }
          );
        }
        await addInternalReviewNote(documentId, user.id, notes);
        return NextResponse.json({
          success: true,
          data: { message: "Note added successfully" },
        });

      default:
        return NextResponse.json(
          {
            success: false,
            code: "VALIDATION_ERROR",
            message: `Invalid action: ${action}`,
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("[API] POST /api/cases/[id]/documents/[docId] error:", error);
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: error.message || "Failed to process document action",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getOrCreateChecklist,
  updateChecklistItem,
  resetChecklist,
} from "@/lib/reviews/review-checklist.service";
import { authorizeCaseRead, authorizeCaseWrite } from "@/lib/auth/case-authorization";
import { getCaseOrganizationId } from "@/lib/cases/case-service";

/**
 * GET /api/cases/[id]/checklist
 * Get checklist for an application (creates if doesn't exist)
 */
export async function GET(
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

    const organizationId = await getCaseOrganizationId(applicationId);

    if (!organizationId) {
      return NextResponse.json(
        { success: false, code: "APPLICATION_NOT_FOUND", message: "Application not found" },
        { status: 404 }
      );
    }

    await authorizeCaseRead(organizationId);

    const checklist = await getOrCreateChecklist(applicationId, user.id);

    return NextResponse.json({ success: true, data: checklist });
  } catch (error: any) {
    console.error("[API] GET /api/cases/[id]/checklist error:", error);
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: error.message || "Failed to get checklist",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cases/[id]/checklist
 * Update checklist item or reset entire checklist
 */
export async function PATCH(
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

    const organizationId = await getCaseOrganizationId(applicationId);

    if (!organizationId) {
      return NextResponse.json(
        { success: false, code: "APPLICATION_NOT_FOUND", message: "Application not found" },
        { status: 404 }
      );
    }

    await authorizeCaseWrite(organizationId);

    const body = await request.json();
    const { action, itemId, completed, notes } = body;

    // Handle reset action
    if (action === "reset") {
      await resetChecklist(applicationId, user.id);
      return NextResponse.json({
        success: true,
        data: { message: "Checklist reset successfully" },
      });
    }

    // Handle update item action
    if (action === "updateItem") {
      if (!itemId) {
        return NextResponse.json(
          {
            success: false,
            code: "VALIDATION_ERROR",
            message: "itemId is required",
          },
          { status: 400 }
        );
      }

      const updatedItem = await updateChecklistItem(itemId, user.id, { completed, notes });

      return NextResponse.json({ success: true, data: updatedItem });
    }

    return NextResponse.json(
      {
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid action",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API] PATCH /api/cases/[id]/checklist error:", error);
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: error.message || "Failed to update checklist",
      },
      { status: 500 }
    );
  }
}

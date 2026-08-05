import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getApplicationDocuments } from "@/lib/reviews/document-review.service";
import { authorizeCaseRead } from "@/lib/auth/case-authorization";
import { getCaseOrganizationId } from "@/lib/cases/case-service";

/**
 * GET /api/cases/[id]/documents
 * Get all documents for an application with verification status
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

    const documents = await getApplicationDocuments(applicationId, user.id);

    return NextResponse.json({ success: true, data: documents });
  } catch (error: any) {
    console.error("[API] GET /api/cases/[id]/documents error:", error);
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: error.message || "Failed to get documents",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  validateDocumentAccess,
  getDocumentAccessHistory,
} from "@/lib/documents/secure-access.service";

/**
 * Document Access History API
 * 
 * Returns all download/preview access attempts for a document
 * 
 * GET /api/documents/[id]/access-history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id: documentId } = await params;

    // 2. Authorization Check (must have access to view history)
    const accessResult = await validateDocumentAccess(
      documentId,
      userId,
      userRole,
      userOrganizationId || undefined
    );

    if (!accessResult.allowed) {
      return NextResponse.json(
        { error: accessResult.reason || "Access denied" },
        { status: accessResult.statusCode }
      );
    }

    // 3. Get Access History
    const history = await getDocumentAccessHistory(
      documentId,
      userId,
      userOrganizationId || accessResult.document!.organizationId,
      userRole
    );

    return NextResponse.json({
      documentId,
      history,
      count: history.length,
    });
  } catch (error: any) {
    console.error("Error fetching document access history:", error);
    return NextResponse.json(
      { error: "Failed to fetch access history" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { authorizeCommunicationWrite } from "@/lib/auth/communication-authorization";
import { resolveCommunicationScope } from "@/lib/communications/scope.service";
import { updateApplicationStatus } from "@/lib/communications/case-communication.service";

/**
 * POST /api/communications/update-status
 * Update application status with timeline entry
 * 
 * Request Body:
 * {
 *   applicationId: string
 *   organizationId: string
 *   newStatus: string
 *   reason?: string
 *   notifyApplicant?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[API] POST /api/communications/update-status");
    
    const user = await getCurrentUser();
    if (!user) {
      console.error("[API] ✗ No user in session");
      return NextResponse.json({
        success: false,
        code: "UNAUTHORIZED",
        message: "You must be logged in"
      }, { status: 401 });
    }

    const body = await request.json();
    const { applicationId, organizationId, newStatus, reason, notifyApplicant } = body;

    console.log("[API] Request params:", {
      applicationId,
      organizationId,
      newStatus,
      hasReason: !!reason
    });

    if (!applicationId || !organizationId || !newStatus) {
      console.error("[API] ✗ Missing required parameters");
      return NextResponse.json({
        success: false,
        code: "MISSING_REQUIRED_FIELDS",
        message: "Missing required parameters: applicationId, organizationId, newStatus"
      }, { status: 400 });
    }

    console.log("[API] Updating application status...");
    await authorizeCommunicationWrite(organizationId, ["org_admin", "case_worker", "reviewer"]);
    const scope = resolveCommunicationScope(user, organizationId);
    const updated = await updateApplicationStatus(
      applicationId,
      newStatus,
      user.id,
      scope,
      {
        reason,
        notifyApplicant: notifyApplicant ?? true,
      }
    );

    console.log("[API] ✓ Application status updated successfully");
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[API] Error in POST /api/communications/update-status:", error);
    const errorMsg = error instanceof Error ? error.message : "Internal server error";
    
    if (errorMsg === "UNAUTHORIZED" || errorMsg === "ORGANIZATION_MISMATCH") {
      return NextResponse.json({
        success: false,
        code: "UNAUTHORIZED",
        message: "You do not have permission to perform this action"
      }, { status: 403 });
    }
    
    if (errorMsg === "APPLICATION_NOT_FOUND") {
      return NextResponse.json({
        success: false,
        code: "APPLICATION_NOT_FOUND",
        message: "Application not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: false,
      code: "INTERNAL_ERROR",
      message: errorMsg
    }, { status: 500 });
  }
}

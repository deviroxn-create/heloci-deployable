import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { authorizeCommunicationWrite } from "@/lib/auth/communication-authorization";
import { resolveCommunicationScope } from "@/lib/communications/scope.service";
import { requestDocumentsInCase } from "@/lib/communications/case-communication.service";

/**
 * POST /api/communications/document-requests
 * Request documents from applicant via message (UPDATED to use CaseMessage model)
 * 
 * Request body:
 * {
 *   applicationId: string (required)
 *   organizationId: string (required)
 *   documentTypes: string[] (required)
 *   messageContent?: string
 *   dueDate?: string (ISO date)
 *   priority?: "low" | "medium" | "high"
 *   notes?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[API] POST /api/communications/document-requests");
    
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
    const { applicationId, organizationId, documentTypes, messageContent, dueDate, priority, notes } = body;

    console.log("[API] Request params:", {
      applicationId,
      organizationId,
      documentTypeCount: documentTypes?.length || 0,
      hasDueDate: !!dueDate
    });

    if (
      !applicationId ||
      !organizationId ||
      !documentTypes ||
      !Array.isArray(documentTypes) ||
      documentTypes.length === 0
    ) {
      console.error("[API] ✗ Missing required fields");
      return NextResponse.json({
        success: false,
        code: "MISSING_REQUIRED_FIELDS",
        message: "Missing required fields: applicationId, organizationId, documentTypes"
      }, { status: 400 });
    }

    console.log("[API] Requesting documents...");
    await authorizeCommunicationWrite(organizationId, ["org_admin", "case_worker", "reviewer"]);
    const scope = resolveCommunicationScope(user, organizationId);
    const result = await requestDocumentsInCase(
      applicationId,
      user.id,
      scope,
      documentTypes,
      {
        message: messageContent || `Please submit the following documents: ${documentTypes.join(", ")}`,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        priority: priority || "medium",
        notes,
      }
    );

    console.log("[API] ✓ Document request created successfully");
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[API] Error in POST /api/communications/document-requests:", error);
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

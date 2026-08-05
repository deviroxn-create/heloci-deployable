import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { authorizeCommunicationRead } from "@/lib/auth/communication-authorization";
import { resolveCommunicationScope } from "@/lib/communications/scope.service";
import { getConversation } from "@/lib/communications/case-communication.service";

/**
 * GET /api/communications/conversation
 * Load complete case conversation with merged timeline
 * 
 * Query Parameters:
 * - applicationId (required)
 * - organizationId (required)
 * - page (optional, default: 1)
 * - pageSize (optional, default: 100)
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[API] GET /api/communications/conversation");
    
    const user = await getCurrentUser();
    if (!user) {
      console.error("[API] ✗ No user in session");
      return NextResponse.json({
        success: false,
        code: "UNAUTHORIZED",
        message: "You must be logged in"
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");
    const organizationId = searchParams.get("organizationId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "100");

    console.log("[API] Request params:", { applicationId, organizationId, page, pageSize });

    if (!applicationId || !organizationId) {
      console.error("[API] ✗ Missing required parameters");
      return NextResponse.json({
        success: false,
        code: "MISSING_REQUIRED_FIELDS",
        message: "Missing required parameters: applicationId, organizationId"
      }, { status: 400 });
    }

    console.log("[API] Loading conversation...");
    await authorizeCommunicationRead(organizationId);
    const scope = resolveCommunicationScope(user, organizationId);
    const conversation = await getConversation(
      applicationId,
      user.id,
      scope,
      { page, pageSize }
    );

    console.log("[API] ✓ Conversation loaded successfully");
    return NextResponse.json({ success: true, data: conversation });
  } catch (error) {
    console.error("[API] Error in GET /api/communications/conversation:", error);
    const errorMsg = error instanceof Error ? error.message : "Internal server error";
    
    if (errorMsg === "UNAUTHORIZED" || errorMsg === "ORGANIZATION_MISMATCH") {
      return NextResponse.json({
        success: false,
        code: "UNAUTHORIZED",
        message: "You do not have permission to access this conversation"
      }, { status: 403 });
    }
    
    if (errorMsg === "APPLICATION_NOT_FOUND") {
      return NextResponse.json({
        success: false,
        code: "APPLICATION_NOT_FOUND",
        message: "Application or conversation not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: false,
      code: "INTERNAL_ERROR",
      message: errorMsg
    }, { status: 500 });
  }
}

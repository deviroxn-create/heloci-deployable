import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { authorizeCommunicationRead, authorizeCommunicationWrite } from "@/lib/auth/communication-authorization";
import { resolveCommunicationScope } from "@/lib/communications/scope.service";
import {
  sendCaseMessage,
  markMessagesAsRead,
  MessageType,
} from "@/lib/communications/case-communication.service";

/**
 * POST /api/communications/messages
 * Send a message or mark as read (UPDATED to use CaseMessage model)
 * 
 * Request body:
 * {
 *   applicationId: string (required)
 *   organizationId: string (required)
 *   content: string (required for sending)
 *   action?: "send" | "mark_read" (default: "send")
 *   messageType?: MessageType (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[API] POST /api/communications/messages");
    
    const user = await getCurrentUser();
    if (!user) {
      console.error("[API] ✗ No user in session");
      return NextResponse.json({
        success: false,
        code: "UNAUTHORIZED",
        message: "You must be logged in to send messages"
      }, { status: 401 });
    }

    console.log("[API] User authenticated:", {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    });

    const body = await request.json();
    const { applicationId, organizationId, content, action = "send", messageType } = body;

    console.log("[API] Request body:", {
      applicationId,
      organizationId,
      action,
      hasContent: !!content,
      messageType
    });

    if (!applicationId || !organizationId) {
      console.error("[API] ✗ Missing required fields");
      return NextResponse.json({
        success: false,
        code: "MISSING_REQUIRED_FIELDS",
        message: "Missing required fields: applicationId, organizationId"
      }, { status: 400 });
    }

    // Mark as read
    if (action === "mark_read") {
      console.log("[API] Marking messages as read...");
      await authorizeCommunicationRead(organizationId);
      const scope = resolveCommunicationScope(user, organizationId);
      await markMessagesAsRead(applicationId, user.id, scope);
      return NextResponse.json({ success: true });
    }

    // Send message (default)
    if (!content?.trim()) {
      console.error("[API] ✗ Message content empty");
      return NextResponse.json({
        success: false,
        code: "CONTENT_REQUIRED",
        message: "Message content is required"
      }, { status: 400 });
    }

    console.log("[API] Sending message...");
    await authorizeCommunicationWrite(organizationId, ["org_admin", "case_worker", "reviewer"]);
    const scope = resolveCommunicationScope(user, organizationId);
    const message = await sendCaseMessage(
      applicationId,
      user.id,
      scope,
      content.trim(),
      {
        messageType: messageType || MessageType.NORMAL,
      }
    );

    console.log("[API] ✓ Message sent successfully:", message.id);
    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    console.error("[API] Error in POST /api/communications/messages:", error);
    const errorMsg = error instanceof Error ? error.message : "Internal server error";
    
    // Map specific errors to structured responses
    if (errorMsg === "UNAUTHORIZED") {
      return NextResponse.json({
        success: false,
        code: "UNAUTHORIZED",
        message: "You do not have permission to perform this action"
      }, { status: 403 });
    }
    
    if (errorMsg === "ORGANIZATION_MISMATCH") {
      return NextResponse.json({
        success: false,
        code: "ORGANIZATION_ACCESS_DENIED",
        message: "You do not have access to this organization"
      }, { status: 403 });
    }
    
    if (errorMsg === "APPLICATION_NOT_FOUND") {
      return NextResponse.json({
        success: false,
        code: "APPLICATION_NOT_FOUND",
        message: "Application not found"
      }, { status: 404 });
    }
    
    if (errorMsg === "SENDER_NOT_FOUND") {
      return NextResponse.json({
        success: false,
        code: "SENDER_NOT_FOUND",
        message: "User account not found"
      }, { status: 404 });
    }
    
    // Generic error
    return NextResponse.json({
      success: false,
      code: "INTERNAL_ERROR",
      message: errorMsg
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import {
  getOperationOrganizationId,
  resolveCommunicationScope,
  canAccessOrganization,
} from "@/lib/communications/scope.service";
import { authorizeCommunicationWrite } from "@/lib/auth/communication-authorization";
import {
  sendCaseMessage,
  MessageType,
  createOrganizationEmailRecord,
} from "@/lib/communications/case-communication.service";
import { getSenderIdentity } from "@/lib/communications/sender-identity.service";
import { buildOrganizationEmailNotificationPayloads } from "@/lib/communications/manual-email-payloads";

/**
 * POST /api/communications/send-message
 * 
 * Unified endpoint for both:
 * 1. Application Conversations - Requires applicationId
 * 2. General Organization Emails - Only requires organizationId
 * 
 * Request Body for Application Conversation:
 * {
 *   applicationId: string (required for app conversations)
 *   organizationId: string (required)
 *   content: string (required)
 *   messageType?: MessageType (optional, defaults to NORMAL)
 *   senderIdentityId?: string (optional)
 *   attachments?: string[] (optional)
 *   messageContext?: "application" | "organization" (optional, inferred if not provided)
 * }
 * 
 * Request Body for Organization Email:
 * {
 *   organizationId: string (required)
 *   content: string (required)
 *   subject?: string (for emails)
 *   messageType?: MessageType (optional, defaults to EMAIL)
 *   senderIdentityId?: string (recommended)
 *   recipients?: Array<{id, email, name}> (required for org emails)
 *   attachments?: string[] (optional)
 *   messageContext: "organization" (required to trigger org email mode)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[API] POST /api/communications/send-message");
    
    const user = await getCurrentUser();
    if (!user) {
      console.error("[API] ✗ No user in session");
      return NextResponse.json({
        success: false,
        code: "UNAUTHORIZED",
        message: "You must be logged in to send messages"
      }, { status: 401 });
    }

    const body = await request.json();
    const {
      applicationId,
      organizationId,
      content,
      messageType,
      senderIdentityId,
      attachments,
      messageContext,
      recipients,
      subject
    } = body;

    console.log("[API] Request body:", {
      applicationId,
      organizationId,
      contentLength: content?.length || 0,
      messageType,
      senderIdentityId,
      hasAttachments: !!attachments,
      messageContext,
      recipientCount: recipients?.length || 0
    });

    // Step 1: Validate core required fields that apply to ALL message types
    if (!organizationId) {
      console.error("[API] ✗ Missing organizationId");
      return NextResponse.json({
        success: false,
        code: "MISSING_ORGANIZATION_ID",
        message: "organizationId is required"
      }, { status: 400 });
    }

    if (!content?.trim()) {
      console.error("[API] ✗ Missing or empty content");
      return NextResponse.json({
        success: false,
        code: "MISSING_CONTENT",
        message: "content is required and cannot be empty"
      }, { status: 400 });
    }

    // Step 2: Determine message context (explicit or inferred)
    // IMPORTANT: messageContext === "organization" means NO applicationId required
    // Only messageContext === "application" OR inferred from applicationId presence means app conversation
    const isApplicationConversation = 
      messageContext === "application" || 
      (messageContext !== "organization" && !!applicationId);
    
    console.log("[API] Message context determination:", {
      explicit: messageContext,
      hasApplicationId: !!applicationId,
      isApplicationConversation,
      inference: messageContext !== "organization" ? "using explicit messageContext or applicationId" : "using organization context"
    });

    // Step 3: Route to appropriate handler based on message type
    if (isApplicationConversation) {
      // ========== APPLICATION CONVERSATION MODE ==========
      console.log("[API] Processing as APPLICATION CONVERSATION");
      
      if (!applicationId) {
        console.error("[API] ✗ applicationId required for application conversations");
        return NextResponse.json({
          success: false,
          code: "MISSING_APPLICATION_ID",
          message: "applicationId is required for application conversations"
        }, { status: 400 });
      }

      return await handleApplicationConversation(
        user,
        user.id,
        applicationId,
        organizationId,
        content.trim(),
        messageType,
        senderIdentityId,
        attachments
      );
    }

    // ========== ORGANIZATION EMAIL MODE ==========
    // General communication hub emails - NO applicationId required
    console.log("[API] Processing as ORGANIZATION EMAIL (no applicationId required)");
    
    if (!senderIdentityId) {
      console.error("[API] ✗ senderIdentityId required for organization emails");
      return NextResponse.json({
        success: false,
        code: "MISSING_SENDER_IDENTITY",
        message: "senderIdentityId is required for organization emails"
      }, { status: 400 });
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      console.error("[API] ✗ recipients required for organization emails");
      return NextResponse.json({
        success: false,
        code: "MISSING_RECIPIENTS",
        message: "recipients array is required and must not be empty"
      }, { status: 400 });
    }

    return await handleOrganizationEmail(
      user,
      user.id,
      organizationId,
      content.trim(),
      subject || "Message",
      senderIdentityId,
      recipients,
      attachments
    );

  } catch (error) {
    console.error("[API] Error in POST /api/communications/send-message:", error);
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

/**
 * Handle application conversation message
 */
async function handleApplicationConversation(
  user: any,
  senderId: string,
  applicationId: string,
  organizationId: string,
  content: string,
  messageType?: string,
  senderIdentityId?: string,
  attachments?: string[]
) {
  const scope = resolveCommunicationScope(user, organizationId);

  // Validate application exists and scope access before sending
  const application = await prisma.programApplication.findUnique({
    where: { id: applicationId },
    include: {
      program: { select: { organizationId: true } },
      user: { select: { id: true } },
    },
  });

  if (!application) {
    console.error("[API] ✗ Application not found");
    return NextResponse.json({
      success: false,
      code: "APPLICATION_NOT_FOUND",
      message: "Application not found"
    }, { status: 404 });
  }

  if (!canAccessOrganization(scope, application.program.organizationId)) {
    console.error("[API] ✗ Organization mismatch for application conversation");
    return NextResponse.json({
      success: false,
      code: "ORGANIZATION_ACCESS_DENIED",
      message: "You do not have access to this organization"
    }, { status: 403 });
  }

  const isApplicant = senderId === application.user.id;
  if (!isApplicant) {
    try {
      await authorizeCommunicationWrite(organizationId, ["org_admin", "case_worker", "reviewer"]);
    } catch (error) {
      console.error("[API] ✗ RBAC check failed for application conversation");
      return NextResponse.json({
        success: false,
        code: "UNAUTHORIZED",
        message: "You do not have permission to send messages for this application"
      }, { status: 403 });
    }
  }

  // Validate sender identity if provided
  let senderIdentity = null;
  if (senderIdentityId) {
    try {
      senderIdentity = await getSenderIdentity(senderIdentityId, scope);
    } catch (error: any) {
      console.error("[API] ✗ Invalid sender identity", error);
      return NextResponse.json({
        success: false,
        code: "SENDER_IDENTITY_NOT_FOUND",
        message: "Invalid sender identity or does not belong to organization"
      }, { status: 400 });
    }

    if (!senderIdentity) {
      console.error("[API] ✗ Invalid sender identity");
      return NextResponse.json({
        success: false,
        code: "SENDER_IDENTITY_NOT_FOUND",
        message: "Invalid sender identity or does not belong to organization"
      }, { status: 400 });
    }

    console.log("[API] Using sender identity:", senderIdentity.displayName, senderIdentity.emailAddress);
  }

  console.log("[API] Sending application conversation message...");
  const message = await sendCaseMessage(
    applicationId,
    senderId,
    scope,
    content,
    {
      messageType: (messageType || MessageType.NORMAL) as MessageType,
      attachmentIds: attachments,
      senderIdentityId: senderIdentityId,
    }
  );

  console.log("[API] ✓ Application message sent successfully:", message.id);
  return NextResponse.json({ success: true, data: message });
}

/**
 * Handle general organization email
 * Does not require an application - purely for general communication
 */
async function handleOrganizationEmail(
  user: any,
  senderId: string,
  organizationId: string,
  content: string,
  subject: string,
  senderIdentityId: string,
  recipients: Array<{ id?: string; email: string; name?: string }>,
  attachments?: string[]
) {
  const scope = resolveCommunicationScope(user, organizationId);
  const operationOrganizationId = getOperationOrganizationId(scope);

  if (!operationOrganizationId) {
    console.error("[API] ✗ Invalid organization context for organization email");
    return NextResponse.json({
      success: false,
      code: "INVALID_ORGANIZATION_CONTEXT",
      message: "Organization context is required to send this message"
    }, { status: 400 });
  }

  // Verify user has permission to send organization emails
  try {
    await authorizeCommunicationWrite(operationOrganizationId, ["org_admin", "case_worker", "reviewer"]);
  } catch (error) {
    console.error("[API] ✗ RBAC check failed for organization email");
    return NextResponse.json({
      success: false,
      code: "UNAUTHORIZED",
      message: "You do not have permission to send organization emails"
    }, { status: 403 });
  }

  // Validate sender identity belongs to organization
  const senderIdentity = await getSenderIdentity(senderIdentityId, scope);
  if (!senderIdentity) {
    console.error("[API] ✗ Invalid sender identity");
    return NextResponse.json({
      success: false,
      code: "SENDER_IDENTITY_NOT_FOUND",
      message: "Invalid sender identity or does not belong to organization"
    }, { status: 400 });
  }

  console.log("[API] Sending organization email from:", senderIdentity.displayName, senderIdentity.emailAddress);
  console.log("[API] Recipients:", recipients.length);

  // Create organization communication record (not tied to an application)
  const organizationEmail = await createOrganizationEmailRecord(
    operationOrganizationId,
    senderId,
    senderIdentityId,
    subject,
    content,
    recipients,
    attachments
  );

  console.log("[API] ✓ Organization email created:", organizationEmail.id);
  console.log("[API] Recipients count:", organizationEmail.recipients.length);

  const payloads = buildOrganizationEmailNotificationPayloads({
    subject,
    content,
    organizationId,
    senderId,
    senderIdentityId,
    recipients,
  });

  console.log("[API] Delivery payloads prepared:", payloads.length);

  return NextResponse.json({ success: true, data: organizationEmail });
}

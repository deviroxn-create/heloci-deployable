import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { requireOrgRole } from "@/lib/auth/rbac";
import { sendEmail } from "@/lib/email/email.service";

/**
 * POST /api/email/send
 * Send an email using NotificationService
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      organizationId,
      recipientEmail,
      cc,
      bcc,
      subject,
      body: messageBody,
      templateId,
      senderIdentityId
    } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    await requireOrgRole(user.id, organizationId, ["org_admin", "manager", "reviewer", "case_worker", "document_officer"]);

    if (!recipientEmail || !subject || !messageBody) {
      return NextResponse.json(
        { error: "recipientEmail, subject, and body are required" },
        { status: 400 }
      );
    }

    const result = await sendEmail({
      organizationId,
      userId: user.id,
      recipientEmail,
      cc,
      bcc,
      subject,
      body: messageBody,
      templateId,
      senderIdentityId
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        notificationLogId: result.notificationLogId,
        message: "Email sent successfully"
      }
    });
  } catch (error) {
    console.error("[Email Send] POST error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

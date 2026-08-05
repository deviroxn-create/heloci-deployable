import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { saveEmailDraft, getEmailDrafts } from "@/lib/email/email.service";

/**
 * GET /api/email/drafts
 * Get user's email drafts with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    const result = await getEmailDrafts(user.id, organizationId, { page, pageSize });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("[Email Drafts] GET error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * POST /api/email/drafts
 * Save or update email draft (autosave)
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
      templateData
    } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    if (!recipientEmail || !subject) {
      return NextResponse.json(
        { error: "recipientEmail and subject are required" },
        { status: 400 }
      );
    }

    const draft = await saveEmailDraft(
      {
        organizationId,
        authorId: user.id,
        recipientEmail,
        cc,
        bcc,
        subject,
        body: messageBody,
        templateId,
        templateData
      },
      user.id,
      organizationId
    );

    return NextResponse.json({
      success: true,
      data: { draft }
    });
  } catch (error) {
    console.error("[Email Drafts] POST error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

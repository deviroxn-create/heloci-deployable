import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { retryFailedEmail } from "@/lib/email/email.service";

/**
 * POST /api/email/retry/[id]
 * Retry sending a failed email (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    const result = await retryFailedEmail(id, user.id, organizationId);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("[Email Retry] POST error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";

    if (message === "EMAIL_NOT_FOUND") {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    if (message === "NOT_AN_EMAIL") {
      return NextResponse.json(
        { error: "This notification is not an email" },
        { status: 400 }
      );
    }

    const status = message === "Unauthorized" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

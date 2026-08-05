import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getSentEmails } from "@/lib/email/email.service";

/**
 * GET /api/email/sent
 * Get sent emails with optional status filter
 * 
 * Query params:
 * - organizationId: Required
 * - status: "all", "delivered", "queued", "failed" (default: "all")
 * - page: Pagination page number
 * - pageSize: Items per page
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const status = searchParams.get("status") as "delivered" | "queued" | "failed" | undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !["delivered", "queued", "failed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status filter" },
        { status: 400 }
      );
    }

    const result = await getSentEmails(user.id, organizationId, {
      page,
      pageSize,
      status
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("[Email Sent] GET error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

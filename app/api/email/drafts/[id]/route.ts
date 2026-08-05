import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { deleteEmailDraft } from "@/lib/email/email.service";

/**
 * DELETE /api/email/drafts/[id]
 * Delete a specific email draft
 */
export async function DELETE(
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

    const result = await deleteEmailDraft(id, user.id, organizationId);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("[Email Draft Delete] DELETE error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    
    if (message === "DRAFT_NOT_FOUND") {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }
    
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const status = message === "Unauthorized" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

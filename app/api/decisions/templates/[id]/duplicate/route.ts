/**
 * Duplicate a decision template
 * POST /api/decisions/templates/[id]/duplicate
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { requireOrgRole } from "@/lib/auth/rbac";
import { duplicateDecisionTemplate } from "@/lib/reviews/decision-template.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const body = await request.json();
    const newName = body.newName;

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_REQUEST", message: "organizationId is required" },
        },
        { status: 400 }
      );
    }

    try {
      await requireOrgRole(user.id, organizationId, ["org_admin", "reviewer"]);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PERMISSION_DENIED",
            message: "You do not have permission to duplicate this template",
          },
        },
        { status: 403 }
      );
    }

    const result = await duplicateDecisionTemplate(id, organizationId, user.id, newName);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: "DUPLICATE_FAILED", message: result.error } },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.template });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while duplicating the template",
          details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
      },
      { status: 500 }
    );
  }
}

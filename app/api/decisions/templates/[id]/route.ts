/**
 * Decision Template Detail API Routes
 * 
 * GET /api/decisions/templates/[id] - Get template
 * PATCH /api/decisions/templates/[id] - Update template
 * DELETE /api/decisions/templates/[id] - Archive template
 * POST /api/decisions/templates/[id]/restore - Restore template
 * POST /api/decisions/templates/[id]/duplicate - Duplicate template
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { requireOrgRole } from "@/lib/auth/rbac";
import {
  getDecisionTemplate,
  updateDecisionTemplate,
  archiveDecisionTemplate,
  restoreDecisionTemplate,
  duplicateDecisionTemplate,
} from "@/lib/reviews/decision-template.service";

/**
 * GET /api/decisions/templates/[id]
 */
export async function GET(
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
      await requireOrgRole(user.id, organizationId, ["org_admin", "reviewer", "case_worker", "viewer"]);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PERMISSION_DENIED",
            message: "You do not have permission to access this template",
          },
        },
        { status: 403 }
      );
    }

    const result = await getDecisionTemplate(id, organizationId, user.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: result.error } },
        { status: 404 }
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
          message: "An error occurred while fetching the template",
          details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/decisions/templates/[id]
 * Update a template
 */
export async function PATCH(
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
      await requireOrgRole(user.id, organizationId, ["org_admin"]);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PERMISSION_DENIED",
            message: "You do not have permission to update this template",
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = await updateDecisionTemplate({
      templateId: id,
      organizationId,
      userId: user.id,
      name: body.name,
      subject: body.subject,
      body: body.body,
      variables: body.variables,
      isDefault: body.isDefault,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: "UPDATE_FAILED", message: result.error } },
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
          message: "An error occurred while updating the template",
          details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/decisions/templates/[id]
 * Archive (soft delete) a template
 */
export async function DELETE(
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
      await requireOrgRole(user.id, organizationId, ["org_admin"]);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PERMISSION_DENIED",
            message: "You do not have permission to archive this template",
          },
        },
        { status: 403 }
      );
    }

    const result = await archiveDecisionTemplate(id, organizationId, user.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: "ARCHIVE_FAILED", message: result.error } },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "Template archived" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while archiving the template",
          details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
      },
      { status: 500 }
    );
  }
}

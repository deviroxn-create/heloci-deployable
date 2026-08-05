/**
 * Decision Templates API Routes
 * 
 * GET /api/decisions/templates - List templates
 * POST /api/decisions/templates - Create template
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  searchDecisionTemplates,
  createDecisionTemplate,
  getDefaultDecisionTemplate,
} from "@/lib/reviews/decision-template.service";
import type { DecisionType } from "@/lib/reviews/decision.types";
import { requireOrgRole } from "@/lib/auth/rbac";

/**
 * GET /api/decisions/templates
 * List decision templates for an organization
 * 
 * Query parameters:
 * - organizationId: string (required)
 * - category: DecisionType (optional)
 * - search: string (optional)
 * - isActive: boolean (optional)
 * - limit: number (optional, default 50)
 * - offset: number (optional, default 0)
 * - default: boolean (optional, get default template for category)
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const category = searchParams.get("category") as DecisionType | null;
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive") === "true" ? true : undefined;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const getDefault = searchParams.get("default") === "true";

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_REQUEST", message: "organizationId is required" },
        },
        { status: 400 }
      );
    }

    // Get default template if requested
    if (getDefault && category) {
      try {
        await requireOrgRole(user.id, organizationId, ["org_admin", "reviewer", "case_worker"]);
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "PERMISSION_DENIED",
              message: "You do not have permission to access default templates for this organization",
            },
          },
          { status: 403 }
        );
      }

      const result = await getDefaultDecisionTemplate(organizationId, category, user.id);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: result.error } },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: result.template });
    }

    // Search templates
    try {
      await requireOrgRole(user.id, organizationId, ["org_admin", "reviewer", "case_worker", "viewer"]);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PERMISSION_DENIED",
            message: "You do not have permission to access templates for this organization",
          },
        },
        { status: 403 }
      );
    }

    const result = await searchDecisionTemplates({
      organizationId,
      userId: user.id,
      category: category || undefined,
      search: search || undefined,
      isActive: isActive || true,
      limit,
      offset,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: "SEARCH_FAILED", message: result.error } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        templates: result.templates,
        total: result.total,
        limit,
        offset,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while fetching templates",
          details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/decisions/templates
 * Create a new decision template
 * 
 * Request body:
 * {
 *   "organizationId": "string",
 *   "name": "string (required)",
 *   "category": "DecisionType (required)",
 *   "subject": "string (optional)",
 *   "body": "string (required)",
 *   "variables": ["string"] (optional)",
 *   "isDefault": "boolean (optional)"
 * }
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { organizationId, name, category, subject, body: templateBody, variables, isDefault } = body;

    // Validate required fields
    if (!organizationId || !name || !category || !templateBody) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "organizationId, name, category, and body are required",
          },
        },
        { status: 400 }
      );
    }

    // Verify user has permission to create templates
    try {
      await requireOrgRole(user.id, organizationId, ["org_admin"]);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PERMISSION_DENIED",
            message: "You do not have permission to create templates in this organization",
          },
        },
        { status: 403 }
      );
    }

    // Create template
    const result = await createDecisionTemplate({
      organizationId,
      userId: user.id,
      name,
      category,
      subject: subject || undefined,
      body: templateBody,
      variables: variables || undefined,
      isDefault: isDefault || false,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: "CREATE_FAILED", message: result.error } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.template,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while creating the template",
          details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
      },
      { status: 500 }
    );
  }
}

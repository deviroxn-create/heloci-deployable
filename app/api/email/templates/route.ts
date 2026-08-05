import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { requireOrgRole } from "@/lib/auth/rbac";
import { listEmailTemplatesForOrganization } from "@/lib/communications/template-queries.service";

/**
 * GET /api/email/templates
 * Get published NotificationTemplates for use in emails
 */
export async function GET(request: NextRequest) {
  try {
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

    // Verify user has access to organization
    await requireOrgRole(user.id, organizationId, ["org_admin", "case_worker"]);

    // Get published templates
    const templates = await listEmailTemplatesForOrganization(organizationId);

    return NextResponse.json({
      success: true,
      data: {
        templates: templates.map((t) => ({
          id: t.id,
          name: t.name,
          subject: t.subject,
          preview: t.plainText?.substring(0, 100) || "",
          version: t.version,
          status: t.status
        }))
      }
    });
  } catch (error) {
    console.error("[Email Templates] GET error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

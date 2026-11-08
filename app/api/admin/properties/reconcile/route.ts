import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationContext } from "@/lib/auth/organization-context";
import { requireOrgRole } from "@/lib/auth/rbac";
import { reconcileImportedProperties } from "@/lib/properties/property-reconciliation.service";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    const body = await request.json() as {
      organizationId?: unknown;
      dryRun?: unknown;
      confirm?: unknown;
      previewToken?: unknown;
    };
    const requestedOrganizationId = typeof body.organizationId === "string" ? body.organizationId : null;
    const organizationId = await getOrganizationContext(user, requestedOrganizationId);
    await requireOrgRole(user.id, organizationId, ["org_admin"]);

    if (typeof body.dryRun !== "boolean") {
      return NextResponse.json({ error: "dryRun must be a boolean" }, { status: 400 });
    }
    if (!body.dryRun && body.confirm !== true) {
      return NextResponse.json({ error: "Explicit confirmation is required to execute reconciliation" }, { status: 400 });
    }
    if (!body.dryRun && typeof body.previewToken !== "string") {
      return NextResponse.json({ error: "A preview token is required to execute reconciliation" }, { status: 400 });
    }

    const report = await reconcileImportedProperties({
      organizationId,
      dryRun: body.dryRun,
      ...(typeof body.previewToken === "string" ? { expectedPreviewToken: body.previewToken } : {})
    });
    return NextResponse.json(report, { status: report.errors.length > 0 ? 207 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reconcile properties.";
    const status = message === "UNAUTHENTICATED" ? 401
      : message === "Unauthorized" || message === "ORGANIZATION_ACCESS_DENIED" ? 403
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

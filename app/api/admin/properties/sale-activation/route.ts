import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationContext } from "@/lib/auth/organization-context";
import { requireOrgRole } from "@/lib/auth/rbac";
import {
  APPROVED_SALE_SCOPE_ID_DIGEST,
  activateAuthorizedSaleInventory,
  previewAuthorizedSaleActivation
} from "@/lib/properties/property-sale-activation.service";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    const body = await request.json() as {
      organizationId?: unknown;
      dryRun?: unknown;
      confirm?: unknown;
      previewToken?: unknown;
      approvedPropertyIds?: unknown;
    };
    const requestedOrganizationId = typeof body.organizationId === "string" ? body.organizationId : null;
    const organizationId = await getOrganizationContext(user, requestedOrganizationId);
    await requireOrgRole(user.id, organizationId, ["org_admin"]);

    if (typeof body.dryRun !== "boolean") {
      return NextResponse.json({ error: "dryRun must be a boolean" }, { status: 400 });
    }
    if (body.dryRun) {
      return NextResponse.json(await previewAuthorizedSaleActivation(organizationId));
    }
    if (body.confirm !== true) {
      return NextResponse.json({ error: "Explicit confirmation is required to activate sale inventory" }, { status: 400 });
    }
    if (typeof body.previewToken !== "string" || !body.previewToken) {
      return NextResponse.json({ error: "A current preview token is required" }, { status: 400 });
    }
    if (!Array.isArray(body.approvedPropertyIds) || body.approvedPropertyIds.some((id) => typeof id !== "string")) {
      return NextResponse.json({ error: "The approved property ID list is required" }, { status: 400 });
    }

    const report = await activateAuthorizedSaleInventory({
      organizationId,
      actorUserId: user.id,
      expectedPreviewToken: body.previewToken,
      approvedPropertyIds: body.approvedPropertyIds as string[],
      approvedScopeDigest: APPROVED_SALE_SCOPE_ID_DIGEST
    });
    return NextResponse.json(report, { status: report.auditVerified && report.persistedStateVerified ? 200 : 207 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to activate sale inventory.";
    const conflict = message === "SALE_ACTIVATION_PREVIEW_STALE"
      || message === "SALE_ACTIVATION_SCOPE_MISMATCH";
    const status = message === "UNAUTHENTICATED" ? 401
      : message === "Unauthorized" || message === "ORGANIZATION_ACCESS_DENIED" ? 403
        : conflict ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

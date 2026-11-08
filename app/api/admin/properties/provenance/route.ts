import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationContext } from "@/lib/auth/organization-context";
import { requireOrgRole } from "@/lib/auth/rbac";
import { getUnknownAvailabilityProvenanceReport } from "@/lib/properties/property-availability-provenance.service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    const organizationId = await getOrganizationContext(user);
    await requireOrgRole(user.id, organizationId, ["org_admin"]);
    return NextResponse.json(await getUnknownAvailabilityProvenanceReport(organizationId));
  } catch (error) {
    return handleProvenanceError(error);
  }
}

function handleProvenanceError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to review availability provenance.";
  const status = message === "UNAUTHENTICATED" ? 401
    : message === "Unauthorized" || message === "ORGANIZATION_ACCESS_DENIED" ? 403
      : 400;
  return NextResponse.json({ error: message }, { status });
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationContext } from "@/lib/auth/organization-context";
import { requireOrgRole } from "@/lib/auth/rbac";
import { approveUnknownAvailabilityProvenance } from "@/lib/properties/property-availability-provenance.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    const organizationId = await getOrganizationContext(user);
    await requireOrgRole(user.id, organizationId, ["org_admin"]);

    const body = await request.json() as {
      decision?: unknown;
      reason?: unknown;
      evidenceToken?: unknown;
      confirmIntentionalAvailability?: unknown;
    };
    if (body.decision !== "AUTOMATIC" && body.decision !== "STAFF") {
      return NextResponse.json({ error: "decision must be AUTOMATIC or STAFF" }, { status: 400 });
    }
    if (typeof body.reason !== "string" || body.reason.trim().length < 12) {
      return NextResponse.json({ error: "Provide a meaningful review reason of at least 12 characters." }, { status: 400 });
    }
    if (body.reason.trim().length > 1000) {
      return NextResponse.json({ error: "Review reason must be 1000 characters or fewer." }, { status: 400 });
    }
    if (body.decision === "STAFF" && body.confirmIntentionalAvailability !== true) {
      return NextResponse.json({ error: "Confirm that the current availability decision is intentional before classifying it as staff-managed." }, { status: 400 });
    }
    if (typeof body.evidenceToken !== "string" || !body.evidenceToken) {
      return NextResponse.json({ error: "A current evidence token is required" }, { status: 400 });
    }

    const { id } = await params;
    const result = await approveUnknownAvailabilityProvenance({
      organizationId,
      propertyId: id,
      actorUserId: user.id,
      decision: body.decision,
      reason: body.reason,
      confirmIntentionalAvailability: body.confirmIntentionalAvailability === true,
      expectedEvidenceToken: body.evidenceToken
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to approve availability provenance.";
    const errorCode = error && typeof error === "object" && "code" in error ? error.code : null;
    const conflict = errorCode === "P2034";
    const status = message === "UNAUTHENTICATED" ? 401
      : message === "Unauthorized" || message === "ORGANIZATION_ACCESS_DENIED" ? 403
        : conflict || message === "PROVENANCE_EVIDENCE_STALE" || message === "PROVENANCE_NOT_UNKNOWN_OR_NOT_FOUND" ? 409
          : 400;
    return NextResponse.json({ error: conflict ? "PROVENANCE_CONCURRENT_UPDATE" : message }, { status });
  }
}

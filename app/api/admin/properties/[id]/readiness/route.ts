import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationContext } from "@/lib/auth/organization-context";
import { requireOrgRole } from "@/lib/auth/rbac";
import { getPropertyEntryReadiness } from "@/lib/properties/admin-property.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    const { id } = await params;
    const organizationId = await getOrganizationContext(user, new URL(request.url).searchParams.get("organizationId"));
    await requireOrgRole(user.id, organizationId, ["org_admin"]);
    return NextResponse.json(await getPropertyEntryReadiness(organizationId, id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read property readiness.";
    const status = message === "PROPERTY_NOT_FOUND" ? 404 : message === "UNAUTHENTICATED" ? 401 : message === "Unauthorized" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
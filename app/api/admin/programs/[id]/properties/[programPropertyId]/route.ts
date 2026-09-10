import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationContext } from "@/lib/auth/organization-context";
import { requireOrgRole } from "@/lib/auth/rbac";
import { updateProgramProperty } from "@/lib/properties/admin-program-property.service";

type RouteContext = { params: Promise<{ id: string; programPropertyId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id, programPropertyId } = await params;
    const body = await request.json() as {
      availableFrom?: string | null;
      availableUntil?: string | null;
      isActive?: boolean;
      organizationId?: string;
    };
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    const organizationId = await getOrganizationContext(user, body.organizationId);
    await requireOrgRole(user.id, organizationId, ["org_admin"]);
    const assignment = await updateProgramProperty(id, programPropertyId, organizationId, body);
    return NextResponse.json({ assignment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update program property.";
    const status = message === "Unauthorized" || message === "ORGANIZATION_ACCESS_DENIED" ? 403 : message === "PROGRAM_PROPERTY_NOT_FOUND" || message === "PROGRAM_NOT_FOUND" ? 404 : message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationContext } from "@/lib/auth/organization-context";
import { requireOrgRole } from "@/lib/auth/rbac";
import { getPropertyForOrganization, updatePropertyForOrganization, type PropertyInput } from "@/lib/properties/admin-property.service";

type RouteContext = { params: Promise<{ id: string }> };

async function getAdminOrganization(requestedOrganizationId?: string | null) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const organizationId = await getOrganizationContext(user, requestedOrganizationId);
  await requireOrgRole(user.id, organizationId, ["org_admin"]);
  return organizationId;
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const organizationId = await getAdminOrganization(searchParams.get("organizationId"));
    const property = await getPropertyForOrganization(organizationId, id);
    if (!property) return NextResponse.json({ error: "Property not found." }, { status: 404 });
    return NextResponse.json({ property });
  } catch (error) {
    return handleAdminError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<PropertyInput> & { organizationId?: string };
    const organizationId = await getAdminOrganization(body.organizationId);
    const { organizationId: _ignoredOrganizationId, ...updates } = body;
    const property = await updatePropertyForOrganization(organizationId, id, updates);
    return NextResponse.json({ property });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update property.";
    if (message === "PROPERTY_NOT_FOUND") return NextResponse.json({ error: "Property not found." }, { status: 404 });
    return handleAdminError(error);
  }
}

function handleAdminError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to manage properties.";
  const status = message === "UNAUTHENTICATED" ? 401 : message === "Unauthorized" || message === "ORGANIZATION_ACCESS_DENIED" ? 403 : 400;
  return NextResponse.json({ error: message }, { status });
}
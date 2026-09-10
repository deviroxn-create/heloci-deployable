import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationContext } from "@/lib/auth/organization-context";
import { requireOrgRole } from "@/lib/auth/rbac";
import { createPropertyForOrganization, listPropertiesForOrganization, type PropertyInput } from "@/lib/properties/admin-property.service";

async function getAdminOrganization(requestedOrganizationId?: string | null) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const organizationId = await getOrganizationContext(user, requestedOrganizationId);
  await requireOrgRole(user.id, organizationId, ["org_admin"]);
  return organizationId;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = await getAdminOrganization(searchParams.get("organizationId"));
    const properties = await listPropertiesForOrganization(organizationId, searchParams.get("status") ?? undefined);
    return NextResponse.json({ properties });
  } catch (error) {
    return handleAdminError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PropertyInput;
    const organizationId = await getAdminOrganization(body && typeof body === "object" ? (body as PropertyInput & { organizationId?: string }).organizationId : null);
    const property = await createPropertyForOrganization(organizationId, body);
    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    return handleAdminError(error);
  }
}

function handleAdminError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to manage properties.";
  const status = message === "UNAUTHENTICATED" ? 401 : message === "Unauthorized" || message === "ORGANIZATION_ACCESS_DENIED" ? 403 : 400;
  return NextResponse.json({ error: message }, { status });
}
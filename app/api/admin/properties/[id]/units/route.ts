import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationContext } from "@/lib/auth/organization-context";
import { requireOrgRole } from "@/lib/auth/rbac";
import { addPropertyUnit, deletePropertyUnit, updatePropertyUnit, type PropertyUnitInput } from "@/lib/properties/admin-property.service";

type RouteContext = { params: Promise<{ id: string }> };

async function authorize(request: Request, id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const body = await request.json() as PropertyUnitInput & { organizationId?: string };
  const organizationId = await getOrganizationContext(user, body.organizationId);
  await requireOrgRole(user.id, organizationId, ["org_admin"]);
  return { body, organizationId, id };
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { body, organizationId } = await authorize(request, id);
    const unit = await addPropertyUnit(organizationId, id, body);
    return NextResponse.json({ unit }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const unitId = new URL(request.url).searchParams.get("unitId");
    if (!unitId) return NextResponse.json({ error: "unitId is required" }, { status: 400 });
    const { body, organizationId } = await authorize(request, id);
    const unit = await updatePropertyUnit(organizationId, id, unitId, body);
    return NextResponse.json({ unit });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const unitId = new URL(request.url).searchParams.get("unitId");
    if (!unitId) return NextResponse.json({ error: "unitId is required" }, { status: 400 });
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    const organizationId = await getOrganizationContext(user, new URL(request.url).searchParams.get("organizationId"));
    await requireOrgRole(user.id, organizationId, ["org_admin"]);
    await deletePropertyUnit(organizationId, id, unitId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to manage property unit.";
  const status = message === "UNAUTHENTICATED" ? 401 : message === "Unauthorized" ? 403 : message === "PROPERTY_NOT_FOUND" || message === "PROPERTY_UNIT_NOT_FOUND" ? 404 : 400;
  return NextResponse.json({ error: message }, { status });
}
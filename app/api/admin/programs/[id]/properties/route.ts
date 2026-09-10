import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationContext } from "@/lib/auth/organization-context";
import { requireOrgRole } from "@/lib/auth/rbac";
import {
  assignPropertyToProgram,
  listProgramProperties,
  type ProgramPropertyInput
} from "@/lib/properties/admin-program-property.service";

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
    const assignments = await listProgramProperties(id, organizationId);
    return NextResponse.json({ assignments });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = (await request.json()) as ProgramPropertyInput & { organizationId?: string };
    const organizationId = await getAdminOrganization(body.organizationId);
    const assignment = await assignPropertyToProgram(id, organizationId, body);
    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to manage program properties.";
  const status = {
    UNAUTHENTICATED: 401,
    Unauthorized: 403,
    ORGANIZATION_ACCESS_DENIED: 403,
    PROGRAM_NOT_FOUND: 404,
    PROPERTY_NOT_FOUND_OR_UNASSIGNED: 409,
    PROGRAM_PROPERTY_NOT_FOUND: 404
  }[message] ?? 400;
  return NextResponse.json({ error: message }, { status });
}
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationContext } from "@/lib/auth/organization-context";
import { getProgramsForAdmin } from "@/lib/programs/program.service";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orgId = await getOrganizationContext(user, searchParams.get("organizationId"));

    const programs = await getProgramsForAdmin(orgId);
    return NextResponse.json(programs);
  } catch (error: any) {
    if (error.message === "NO_ORGANIZATION") {
      return NextResponse.json({ error: "no_org" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const body = await req.json();
    const orgId = await getOrganizationContext(user, body.organizationId);

    const { createProgram } = await import("@/lib/organizations/dashboard-service");
    const program = await createProgram(orgId, user.id, body);
    return NextResponse.json(program, { status: 201 });
  } catch (err: any) {
    if (err.message === "NO_ORGANIZATION") {
      return NextResponse.json({ error: "no_org" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
// duplicate admin/global handlers removed in favor of org-scoped handlers above

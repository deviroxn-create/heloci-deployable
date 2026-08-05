import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { updateProgram } from "@/lib/organizations/dashboard-service";
import { canAccessOrganization } from "@/lib/auth/organization-context";
import { getProgramForAdmin } from "@/lib/programs/program.service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const { id } = await params;
    const program = await getProgramForAdmin(id);
    if (!program) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // Check if user can access this program's organization
    const hasAccess = await canAccessOrganization(user, program.organizationId);
    if (!hasAccess) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    return NextResponse.json(program);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const body = await req.json();
    const { id } = await params;
    const updated = await updateProgram(id, user.id, body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

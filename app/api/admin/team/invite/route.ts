import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationContext } from "@/lib/auth/organization-context";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const body = await req.json();
    const orgId = await getOrganizationContext(user, body.organizationId);
    
    const { inviteStaff } = await import("@/lib/organizations/team-service");
    const invite = await inviteStaff(orgId, user.id, body.email, body.role);
    return NextResponse.json(invite, { status: 201 });
  } catch (err: any) {
    if (err.message === "NO_ORGANIZATION") {
      return NextResponse.json({ error: "no_org" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

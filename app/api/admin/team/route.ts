import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationContext } from "@/lib/auth/organization-context";
import { getOrganizationMembers } from "@/lib/programs/program.service";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orgId = await getOrganizationContext(user, searchParams.get("organizationId"));

    const members = await getOrganizationMembers(orgId);
    return NextResponse.json(members);
  } catch (error: any) {
    if (error.message === "NO_ORGANIZATION") {
      return NextResponse.json({ error: "no_org" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

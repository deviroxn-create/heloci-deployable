import { NextResponse } from "next/server";
import { getOrgDashboard } from "@/lib/organizations/dashboard-service";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(_req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const orgId = user.organizationId;
  if (!orgId) return NextResponse.json({ error: "no_org" }, { status: 400 });

  const stats = await getOrgDashboard(orgId, user.id);
  return NextResponse.json(stats);
}

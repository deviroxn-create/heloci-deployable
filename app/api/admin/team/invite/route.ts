import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = await req.json();
  try {
    const { inviteStaff } = await import("@/lib/organizations/team-service");
    const invite = await inviteStaff(user.organizationId!, user.id, body.email, body.role);
    return NextResponse.json(invite, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

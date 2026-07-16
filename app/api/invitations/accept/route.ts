import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = await req.json();
  try {
    const { acceptInvitation } = await import("@/lib/organizations/team-service");
    const member = await acceptInvitation(body.token, user.id);
    return NextResponse.json(member);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

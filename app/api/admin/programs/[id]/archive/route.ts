import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { archiveProgram } from "@/lib/organizations/dashboard-service";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  try {
    const { id } = await params;
    const archived = await archiveProgram(id, user.id);
    return NextResponse.json(archived);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

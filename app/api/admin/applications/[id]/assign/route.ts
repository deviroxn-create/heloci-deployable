import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { assignApplication } from "@/lib/applications/review-service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const assignedUserId = body.userId as string | undefined;

  if (!assignedUserId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  try {
    const result = await assignApplication(id, user.id, assignedUserId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { authorizeApplicationDecision } from "@/lib/auth/application-authorization";
import { addInternalNote, getApplicationOrganizationId } from "@/lib/applications/review-service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const note = body.note as string | undefined;

  if (!note) {
    return NextResponse.json({ error: "note is required." }, { status: 400 });
  }

  try {
    const organizationId = await getApplicationOrganizationId(id);
    if (!organizationId) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    await authorizeApplicationDecision(organizationId);

    const result = await addInternalNote(id, note, user.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { authorizeApplicationAdmin } from "@/lib/auth/application-authorization";
import { assignApplication, getApplicationOrganizationId } from "@/lib/applications/review-service";

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
    const organizationId = await getApplicationOrganizationId(id);
    if (!organizationId) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    await authorizeApplicationAdmin(organizationId);

    const result = await assignApplication(id, assignedUserId, user.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { authorizeApplicationDecision } from "@/lib/auth/application-authorization";
import { updateApplicationStatus, getApplicationOrganizationId } from "@/lib/applications/review-service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const action = body.action as "approve" | "reject" | "waitlist" | "request_info";
  const reason = body.reason as string | undefined;
  const internalNote = body.internalNote as string | undefined;
  const requestedDocs = body.requestedDocs as string[] | undefined;

  try {
    const organizationId = await getApplicationOrganizationId(id);
    if (!organizationId) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    await authorizeApplicationDecision(organizationId);

    const result = await updateApplicationStatus(id, action, user.id, { reason, internalNote, requestedDocs });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}

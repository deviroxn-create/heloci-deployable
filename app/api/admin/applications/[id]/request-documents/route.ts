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
  const documents = body.documents as string[] | undefined;
  const reason = body.reason as string | undefined;

  if (!documents || !documents.length) {
    return NextResponse.json({ error: "documents are required." }, { status: 400 });
  }

  try {
    const organizationId = await getApplicationOrganizationId(id);
    if (!organizationId) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    await authorizeApplicationDecision(organizationId);

    const result = await updateApplicationStatus(id, "request_info", user.id, { reason, requestedDocs: documents });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}

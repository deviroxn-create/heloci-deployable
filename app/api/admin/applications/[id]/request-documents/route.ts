import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { updateApplicationStatus } from "@/lib/applications/review-service";

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
    const result = await updateApplicationStatus(id, user.id, "request_info", { reason, requestedDocs: documents });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}

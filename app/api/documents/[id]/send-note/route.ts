import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { requireOrgRole } from "@/lib/auth/rbac";
import { getDocumentOrganizationId, sendApplicantNoteForDocument } from "@/lib/documents/document.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { note, isInternal } = await request.json();
    const { id: documentId } = await params;

    if (!note?.trim()) {
      return NextResponse.json({ error: "Note is required" }, { status: 400 });
    }

    const organizationId = await getDocumentOrganizationId(documentId);
    if (!organizationId) {
      return NextResponse.json({ error: "Invalid document state" }, { status: 500 });
    }

    await requireOrgRole(user.id, organizationId, ["org_admin", "reviewer", "case_worker"]);

    try {
      const result = await sendApplicantNoteForDocument({
        documentId,
        userId: user.id,
        note,
        userName: user.name,
      });
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send note";
      if (message === "Document not found") {
        return NextResponse.json({ error: message }, { status: 404 });
      }
      if (message === "Invalid document state") {
        return NextResponse.json({ error: message }, { status: 500 });
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }

    if (isInternal) {
      return NextResponse.json({ error: "Use the existing internal note mechanism" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Error sending applicant note:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send note" },
      { status: 500 }
    );
  }
}

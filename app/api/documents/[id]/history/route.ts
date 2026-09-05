import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { requireOrgRole } from "@/lib/auth/rbac";
import { getDocumentAuditHistory, getDocumentOrganizationId } from "@/lib/documents/document.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: documentId } = await params;

    const organizationId = await getDocumentOrganizationId(documentId);
    if (!organizationId) {
      return NextResponse.json({ error: "Invalid document state" }, { status: 500 });
    }

    await requireOrgRole(
      user.id,
      organizationId,
      ["org_admin", "reviewer", "viewer", "case_worker"]
    );

    const documentContext = await getDocumentAuditHistory(documentId);
    return NextResponse.json(documentContext);

  } catch (error: any) {
    console.error("Error fetching document history:", error);
    const message = error instanceof Error ? error.message : "";
    const status = message === "Unauthorized" ? 403 : message === "Document not found" ? 404 : 500;
    return NextResponse.json(
      { error: status === 403 ? "Unauthorized" : status === 404 ? "Document not found" : "Failed to fetch document history" },
      { status }
    );
  }
}


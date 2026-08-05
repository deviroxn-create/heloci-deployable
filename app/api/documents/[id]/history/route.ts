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
    return NextResponse.json(
      { error: error.message || "Failed to fetch document history" },
      { status: 500 }
    );
  }
}


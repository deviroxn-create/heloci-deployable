import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getCaseDetail, updateCaseStatus, assignCase, addCaseNote, requestDocuments, getCaseOrganizationId } from "@/lib/cases/case-service";
import { authorizeCaseRead, authorizeCaseWrite, authorizeCaseAssignment } from "@/lib/auth/case-authorization";

/**
 * GET /api/cases/[id]
 * Fetch detailed case information
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await getCaseOrganizationId(id);
    if (!organizationId) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    await authorizeCaseRead(organizationId);

    const caseDetail = await getCaseDetail(id, user.id);
    return NextResponse.json(caseDetail);
  } catch (error: any) {
    console.error(`GET /api/cases/[${id}] error:`, error);
    if (error.message === "Case not found") {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || "Failed to fetch case" }, { status: 500 });
  }
}

/**
 * PATCH /api/cases/[id]
 * Update case status, assignment, or notes
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const organizationId = await getCaseOrganizationId(id);
    if (!organizationId) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Status change
    if (body.action === "updateStatus") {
      await authorizeCaseWrite(organizationId);
      await updateCaseStatus(id, user.id, body.status, body.reason);
      return NextResponse.json({ success: true });
    }

    // Case assignment
    if (body.action === "assign") {
      await authorizeCaseAssignment(organizationId);
      await assignCase(id, user.id, body.assignToUserId);
      return NextResponse.json({ success: true });
    }

    // Add internal note
    if (body.action === "addNote") {
      await authorizeCaseWrite(organizationId);
      await addCaseNote(id, user.id, body.note);
      return NextResponse.json({ success: true });
    }

    // Request documents
    if (body.action === "requestDocuments") {
      await authorizeCaseWrite(organizationId);
      await requestDocuments(id, user.id, body.documentTypes, body.expiryDays);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error(`PATCH /api/cases/[${id}] error:`, error);
    if (error.message === "Case not found") {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || "Failed to update case" }, { status: 500 });
  }
}

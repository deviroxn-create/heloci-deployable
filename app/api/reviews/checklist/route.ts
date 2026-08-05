import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { authorizeCaseRead } from "@/lib/auth/case-authorization";
import { getOrCreateChecklist } from "@/lib/reviews/review.service";

/**
 * GET /api/reviews/checklist
 * Get or create a review checklist for an application
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const applicationId = searchParams.get("applicationId");
    const organizationId = searchParams.get("organizationId");

    if (!applicationId || !organizationId) {
      return NextResponse.json(
        { error: "applicationId and organizationId are required" },
        { status: 400 }
      );
    }

    await authorizeCaseRead(organizationId);
    const checklist = await getOrCreateChecklist(applicationId, user.id, organizationId);

    return NextResponse.json(checklist);
  } catch (error: any) {
    console.error("Error fetching checklist:", error);

    if (error.message === "APPLICATION_NOT_FOUND") {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (error.message === "ORGANIZATION_MISMATCH") {
      return NextResponse.json({ error: "Organization mismatch" }, { status: 403 });
    }

    if (error.message.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to fetch checklist", details: error.message },
      { status: 500 }
    );
  }
}

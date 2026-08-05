import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getCaseList, type CaseListFilters } from "@/lib/cases/case-service";
import { getOrganizationContext } from "@/lib/auth/organization-context";
import { authorizeCaseRead } from "@/lib/auth/case-authorization";

/**
 * GET /api/cases
 * Fetch paginated list of cases for current user's organization
 */
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    
    // Get organization context (handles Super Admin)
    const organizationId = await getOrganizationContext(user, searchParams.get("organizationId"));

    await authorizeCaseRead(organizationId);

    const filters: CaseListFilters = {
      staffUserId: user.id,
      status: searchParams.get("status")?.split(","),
      assignedTo: searchParams.get("assignedTo") || undefined,
      programId: searchParams.get("programId") || undefined,
      search: searchParams.get("search") || undefined,
      matchScoreMin: searchParams.get("matchScoreMin") ? parseInt(searchParams.get("matchScoreMin")!) : undefined,
      submittedAfter: searchParams.get("submittedAfter") ? new Date(searchParams.get("submittedAfter")!) : undefined,
      submittedBefore: searchParams.get("submittedBefore") ? new Date(searchParams.get("submittedBefore")!) : undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      pageSize: searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!) : 25,
      sortBy: (searchParams.get("sortBy") as any) || "submitted",
      sortOrder: (searchParams.get("sortOrder") as any) || "desc"
    };

    const result = await getCaseList(organizationId, filters);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/cases error:", error);
    
    // Handle specific errors
    if (error.message === "NO_ORGANIZATION" || error.message === "ORGANIZATION_NOT_FOUND") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: error.message || "Failed to fetch cases" }, { status: 500 });
  }
}

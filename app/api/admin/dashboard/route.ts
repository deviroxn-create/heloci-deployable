import { NextResponse } from "next/server";
import { getOrgDashboard } from "@/lib/organizations/dashboard-service";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationContext } from "@/lib/auth/organization-context";

export async function GET(req: Request) {
  try {
    console.log("[API] GET /api/admin/dashboard");
    
    const user = await getCurrentUser();
    if (!user) {
      console.error("[API] ✗ No user in session");
      return NextResponse.json({
        success: false,
        code: "UNAUTHORIZED",
        message: "You must be logged in"
      }, { status: 401 });
    }

    console.log("[API] User authenticated:", {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      isPlatformAdmin: user.isPlatformAdmin
    });

    const { searchParams } = new URL(req.url);
    const requestedOrgId = searchParams.get("organizationId");
    
    console.log("[API] Resolving organization context...", {
      requestedOrgId,
      userOrgId: user.organizationId
    });

    const orgId = await getOrganizationContext(user, requestedOrgId);
    
    console.log("[API] Organization context resolved:", { orgId });
    console.log("[API] Fetching dashboard stats...");

    const stats = await getOrgDashboard(orgId, user.id);
    
    console.log("[API] ✓ Dashboard loaded successfully");
    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    console.error("[API] Dashboard API error:", error);
    
    if (error.message === "NO_ORGANIZATION") {
      return NextResponse.json({
        success: false,
        code: "NO_ORGANIZATION",
        message: "No organization found. Please contact support."
      }, { status: 400 });
    }
    
    if (error.message === "Unauthorized") {
      return NextResponse.json({
        success: false,
        code: "UNAUTHORIZED",
        message: "You do not have permission to access this organization"
      }, { status: 403 });
    }
    
    return NextResponse.json({
      success: false,
      code: "INTERNAL_ERROR",
      message: error.message || "Failed to load dashboard"
    }, { status: 500 });
  }
}

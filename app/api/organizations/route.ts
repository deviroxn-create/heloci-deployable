import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationsForUser } from "@/lib/organizations/organization-context";

/**
 * GET /api/organizations
 * Get list of organizations accessible to the user
 * 
 * For Platform Super Admin (role=SUPER_ADMIN, organizationId=NULL): returns ALL organizations
 * For Org Admin/Staff: returns their single organization
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizations = await getOrganizationsForUser(user);
    return NextResponse.json({ success: true, data: organizations });
  } catch (error) {
    console.error("[Organizations] GET error:", error);
    const errorMsg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

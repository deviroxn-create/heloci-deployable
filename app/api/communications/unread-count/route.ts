import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { authorizeCommunicationRead } from "@/lib/auth/communication-authorization";
import { resolveCommunicationScope } from "@/lib/communications/scope.service";
import { getUnreadCount } from "@/lib/communications/case-communication.service";

/**
 * GET /api/communications/unread-count
 * Get unread message count for current user
 * 
 * Query params:
 * - organizationId: (optional) For staff, defaults to user's org. Required for super admin.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let organizationId = searchParams.get("organizationId");

    // For staff/org users, use their organization
    if (!organizationId && user.organizationId) {
      organizationId = user.organizationId;
    }

    // Super admin must specify organizationId
    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId required for platform admin" },
        { status: 400 }
      );
    }

    // For applicants, just return 0 (they don't have unread staff messages in the same way)
    if (!user.organizationId) {
      return NextResponse.json({ success: true, data: { unreadCount: 0 } });
    }

    await authorizeCommunicationRead(organizationId);
    const scope = resolveCommunicationScope(user, organizationId);
    const unreadCount = await getUnreadCount(user.id, scope);
    return NextResponse.json({ success: true, data: { unreadCount } });
  } catch (error) {
    console.error("[Unread Count] GET error:", error);
    const errorMsg = error instanceof Error ? error.message : "Internal server error";
    const status =
      errorMsg === "UNAUTHORIZED" || errorMsg === "ORGANIZATION_MISMATCH"
        ? 403
        : 500;
    return NextResponse.json({ error: errorMsg }, { status });
  }
}

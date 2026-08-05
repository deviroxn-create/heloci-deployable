import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { authorizeCommunicationRead } from "@/lib/auth/communication-authorization";
import { resolveCommunicationScope } from "@/lib/communications/scope.service";
import { markMessagesAsRead } from "@/lib/communications/case-communication.service";

/**
 * POST /api/communications/mark-read
 * Mark messages as read in conversation
 * 
 * Request Body:
 * {
 *   applicationId: string
 *   organizationId: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { applicationId, organizationId } = body;

    if (!applicationId || !organizationId) {
      return NextResponse.json(
        { error: "Missing required parameters: applicationId, organizationId" },
        { status: 400 }
      );
    }

    await authorizeCommunicationRead(organizationId);
    const scope = resolveCommunicationScope(user, organizationId);
    await markMessagesAsRead(applicationId, user.id, scope);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Mark Read] POST error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    const status =
      msg === "UNAUTHORIZED" || msg === "ORGANIZATION_MISMATCH"
        ? 403
        : msg === "APPLICATION_NOT_FOUND"
        ? 404
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

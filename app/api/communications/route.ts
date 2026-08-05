import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { authorizeCommunicationRead } from "@/lib/auth/communication-authorization";
import { resolveCommunicationScope } from "@/lib/communications/scope.service";
import {
  getConversation,
  getStaffConversationList,
  getApplicantConversationsForUser,
  getAdminOrganizationConversationOverview,
} from "@/lib/communications/case-communication.service";

/**
 * GET /api/communications
 * Get conversations/messages (UPDATED to use CaseMessage model)
 * 
 * Query params:
 * - applicationId: Get conversation for specific application
 * - organizationId: Required for staff context
 * - view: "staff" or "applicant" (default: "staff")
 * - unreadOnly: Boolean for staff view
 * - page: Pagination page number
 * - pageSize: Items per page
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const applicationId = searchParams.get("applicationId");
    const view = searchParams.get("view") || "staff";
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "25");

    // Get specific application conversation
    if (applicationId && organizationId) {
      await authorizeCommunicationRead(organizationId);
      const scope = resolveCommunicationScope(user, organizationId);
      const conversation = await getConversation(
        applicationId,
        user.id,
        scope,
        { page, pageSize: 100 }
      );
      return NextResponse.json({ success: true, data: conversation });
    }

    // Get staff conversations list
    if (view === "staff" && organizationId) {
      await authorizeCommunicationRead(organizationId);
      const scope = resolveCommunicationScope(user, organizationId);
      const conversations = await getStaffConversationList(user.id, scope, {
        unreadOnly,
        page,
        pageSize,
      });
      return NextResponse.json({ success: true, data: conversations });
    }

    // Get applicant conversations
    if (view === "applicant") {
      const conversations = await getApplicantConversationsForUser(user.id);
      return NextResponse.json({ success: true, data: conversations });
    }

    // Platform-only exception: Admin view (all organizations)
    // This is an intentional platform-admin-only endpoint
    // Uses explicit role check instead of organizationId (which is null for platform admins)
    if (view === "admin") {
      // Only platform super admin can view all orgs
      // PLATFORM EXCEPTION: Direct role/org check is intentional here
      if (user.role !== "SUPER_ADMIN" || user.organizationId) {
        return NextResponse.json(
          { error: "Only platform super admin can view all organizations" },
          { status: 403 }
        );
      }

      const organizationConversations = await getAdminOrganizationConversationOverview(user.id, {
        page,
        pageSize,
      });

      return NextResponse.json({ success: true, data: { organizationConversations } });
    }

    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Communications] GET error:", error);
    const errorMsg = error instanceof Error ? error.message : "Internal server error";
    const status =
      errorMsg === "UNAUTHORIZED" || errorMsg === "ORGANIZATION_MISMATCH"
        ? 403
        : errorMsg === "APPLICATION_NOT_FOUND"
        ? 404
        : 500;
    return NextResponse.json({ error: errorMsg }, { status });
  }
}

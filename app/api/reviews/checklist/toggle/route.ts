import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { authorizeCaseWrite } from "@/lib/auth/case-authorization";
import { toggleChecklistItem } from "@/lib/reviews/review.service";

/**
 * POST /api/reviews/checklist/toggle
 * Toggle a checklist item's completion status
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, completed, organizationId, notes } = body;

    if (!itemId || typeof completed !== "boolean" || !organizationId) {
      return NextResponse.json(
        { error: "itemId, completed (boolean), and organizationId are required" },
        { status: 400 }
      );
    }

    await authorizeCaseWrite(organizationId);
    const updatedItem = await toggleChecklistItem(
      itemId,
      user.id,
      organizationId,
      completed,
      notes
    );

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error("Error toggling checklist item:", error);

    if (error.message === "CHECKLIST_ITEM_NOT_FOUND") {
      return NextResponse.json({ error: "Checklist item not found" }, { status: 404 });
    }

    if (error.message === "ORGANIZATION_MISMATCH") {
      return NextResponse.json({ error: "Organization mismatch" }, { status: 403 });
    }

    if (error.message.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to toggle checklist item", details: error.message },
      { status: 500 }
    );
  }
}

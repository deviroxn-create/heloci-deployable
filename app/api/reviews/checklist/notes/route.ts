import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { authorizeCaseWrite } from "@/lib/auth/case-authorization";
import { updateChecklistItemNotes } from "@/lib/reviews/review.service";

/**
 * POST /api/reviews/checklist/notes
 * Update notes on a checklist item
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, notes, organizationId } = body;

    if (!itemId || !organizationId) {
      return NextResponse.json(
        { error: "itemId and organizationId are required" },
        { status: 400 }
      );
    }

    await authorizeCaseWrite(organizationId);
    const updatedItem = await updateChecklistItemNotes(
      itemId,
      user.id,
      organizationId,
      notes || ""
    );

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error("Error updating checklist item notes:", error);

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
      { error: "Failed to update checklist item notes", details: error.message },
      { status: 500 }
    );
  }
}

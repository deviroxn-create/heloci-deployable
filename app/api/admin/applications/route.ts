import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { authorizeApplicationReview } from "@/lib/auth/application-authorization";
import { getApplicationsForReview } from "@/lib/applications/review-service";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.getAll("status");
  const assignedTo = url.searchParams.get("assignedTo") ?? undefined;
  const programId = url.searchParams.get("programId") ?? undefined;
  const search = url.searchParams.get("search") ?? undefined;
  const orgId = url.searchParams.get("organizationId");

  if (!orgId) {
    return NextResponse.json({ error: "organizationId is required." }, { status: 400 });
  }

  try {
    // Authorize application review access
    await authorizeApplicationReview(orgId);

    // Convert "me" filter to actual userId
    const resolvedAssignedTo = assignedTo === "me" ? user.id : assignedTo;

    const result = await getApplicationsForReview(orgId, {
      status: status.length ? status : undefined,
      assignedTo: resolvedAssignedTo,
      programId,
      search
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}

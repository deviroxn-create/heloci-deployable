import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { authorizeApplicationReview } from "@/lib/auth/application-authorization";
import { getApplicationDetail, getApplicationOrganizationId } from "@/lib/applications/review-service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const organizationId = await getApplicationOrganizationId(id);
    if (!organizationId) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    await authorizeApplicationReview(organizationId);

    const detail = await getApplicationDetail(id);
    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { listApplicationsForUser } from "@/lib/applications/application-service";

/**
 * GET /api/applications/my
 * Returns all ProgramApplications for the signed-in applicant,
 * enriched with program name and any document requests.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const applications = await listApplicationsForUser(user.id);

    return NextResponse.json({ applications });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Unable to load applications." },
      { status: 500 }
    );
  }
}

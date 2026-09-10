import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getApprovedApplicantProperties } from "@/lib/properties/applicant-property-discovery.service";

/**
 * GET /api/applicant/properties
 * Returns properties currently available through the signed-in applicant's
 * approved programs. Program access is derived from the authenticated user.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (user.role !== "APPLICANT") {
      return NextResponse.json({ error: "Applicant access required." }, { status: 403 });
    }

    const programs = await getApprovedApplicantProperties(user.id);
    return NextResponse.json({ programs });
  } catch (error) {
    console.error("GET /api/applicant/properties error:", error);
    return NextResponse.json({ error: "Unable to load available properties." }, { status: 500 });
  }
}
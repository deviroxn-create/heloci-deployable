import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { applicantProfileSchema } from "@/lib/validations/applicant-profile.schema";
import { loadApplicantProfile, saveApplicantProfile } from "@/services/applicant-profile.service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const profile = await loadApplicantProfile(user.id);
  const completeness = {
    score: 0,
    status: "NOT_STARTED",
    completedSections: []
  };

  return NextResponse.json({
    profile,
    completeness
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (user.role !== "APPLICANT") {
    return NextResponse.json({ error: "Only applicants can save a profile." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = applicantProfileSchema.parse(body);
    const result = await saveApplicantProfile({ userId: user.id, ...parsed });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save profile." }, { status: 400 });
  }
}

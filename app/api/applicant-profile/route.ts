import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { applicantProfileSchema } from "@/lib/validations/applicant-profile.schema";
import { calculateProfileCompleteness, loadApplicantProfile, saveApplicantProfile } from "@/services/applicant-profile.service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const profile = await loadApplicantProfile(user.id);
  const completeness = calculateProfileCompleteness(profile);

  return NextResponse.json({
    profile,
    completeness
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "APPLICANT") {
    return NextResponse.json({ error: "Only applicants can save a profile." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const normalizedBody = typeof body === "object" && body && !Array.isArray(body) ? { ...body } : body;

    if (normalizedBody && typeof normalizedBody === "object" && "income" in normalizedBody) {
      if (normalizedBody.income === "prefer_not_to_say") {
        normalizedBody.income = null;
      } else if (typeof normalizedBody.income === "string" && normalizedBody.income.trim()) {
        normalizedBody.income = { incomeRange: normalizedBody.income };
      }
    }

    const parsed = applicantProfileSchema.safeParse(normalizedBody);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid applicant profile payload." }, { status: 400 });
    }

    const result = await saveApplicantProfile({ userId: user.id, ...parsed.data });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Applicant profile save failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save profile." }, { status: 500 });
  }
}

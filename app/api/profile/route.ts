import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { saveApplicantProfile } from "@/services/applicant-profile.service";

export async function POST(req: Request) {
  const user = await getCurrentUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "APPLICANT") {
    return NextResponse.json({ error: "Only applicants can save a profile." }, { status: 403 });
  }

  const values = await req.json();

  try {
    await saveApplicantProfile({ userId: user.id, ...values });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Legacy profile save failed:", error);
    return NextResponse.json({ error: (error as Error).message || "Unable to save profile." }, { status: 500 });
  }
}

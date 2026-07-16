import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { runEligibilityEngine } from "@/lib/eligibility/engine";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (user.role !== "APPLICANT") {
    return NextResponse.json({ error: "Only applicants can access eligibility matches." }, { status: 403 });
  }

  try {
    const result = await runEligibilityEngine(user.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Unable to load eligibility results." }, { status: 500 });
  }
}

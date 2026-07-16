import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { runEligibilityEngine } from "@/lib/eligibility/engine";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const matches = await runEligibilityEngine(user.id);
    return NextResponse.json({ matches, totalEligible: matches.filter((item) => item.isEligible).length });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Unable to run eligibility engine." }, { status: 500 });
  }
}

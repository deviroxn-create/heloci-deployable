import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { runEligibilityEngine } from "@/lib/eligibility/engine";
import { getProgramMatches } from "@/lib/matching/engine";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    await runEligibilityEngine(user.id);
    const matches = await getProgramMatches(user.id);
    return NextResponse.json(matches);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Unable to refresh matches." }, { status: 500 });
  }
}

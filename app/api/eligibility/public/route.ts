import { NextResponse } from "next/server";
import { evaluateEligibilityForProfile } from "@/lib/eligibility/engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Eligibility answers are required." }, { status: 400 });
    }

    const results = await evaluateEligibilityForProfile(body as Record<string, unknown>);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Public eligibility check failed:", error);
    return NextResponse.json({ error: "Unable to run the eligibility check." }, { status: 500 });
  }
}

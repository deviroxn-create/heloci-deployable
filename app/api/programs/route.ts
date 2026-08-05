import { NextResponse } from "next/server";
import { getPublicPrograms } from "@/lib/programs/program.service";

export async function GET() {
  try {
    // Public, applicant-facing list of active programs. Do not require authentication so
    // browsing is available to visitors and signed-out users.
    const programs = await getPublicPrograms();

    return NextResponse.json(programs);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Unable to load programs." }, { status: 500 });
  }
}

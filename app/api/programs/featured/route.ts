import { NextResponse } from "next/server";
import { getFeaturedPrograms } from "@/lib/programs/program.service";

export async function GET() {
  try {
    const programs = await getFeaturedPrograms();

    return NextResponse.json(programs);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Unable to load featured programs." }, { status: 500 });
  }
}

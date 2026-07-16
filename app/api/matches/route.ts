import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getProgramMatches } from "@/lib/matching/engine";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const matches = await getProgramMatches(user.id);
    return NextResponse.json(matches);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Unable to load matches." }, { status: 500 });
  }
}

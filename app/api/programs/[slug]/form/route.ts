import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getFormForProgram } from "@/lib/forms/renderer";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { slug } = await params;
  const form = await getFormForProgram(slug, user.id);
  return NextResponse.json(form);
}

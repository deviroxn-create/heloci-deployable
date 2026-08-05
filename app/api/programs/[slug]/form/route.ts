import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getFormForProgram } from "@/lib/forms/renderer";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (user.role !== "APPLICANT") {
    return NextResponse.json({ error: "Only applicants can access application forms." }, { status: 403 });
  }

  const { slug } = await params;
  // honor optional query param to create a draft when explicitly requested by the UI
  const url = new URL(_req.url);
  const createDraft = url.searchParams.get("createDraft") === "true";

  const form = await getFormForProgram(slug, user.id, { createDraft });
  return NextResponse.json(form);
}

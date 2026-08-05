import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createApplication } from "@/services/application.service";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await request.json();
  const programId = typeof body.programId === "string" ? body.programId.trim() : "";
  const programName = (typeof body.programName === "string" ? body.programName.trim() : "") || (typeof body.programSlug === "string" ? body.programSlug.trim() : "") || "Selected program";
  const payload = body.data as Record<string, unknown> | undefined;

  if (!programId) {
    return NextResponse.json({ error: "Program is required." }, { status: 400 });
  }

  try {
    const application = await createApplication(user.id, programId, programName);

    return NextResponse.json({ success: true, applicationId: application.id, payload });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Unable to create application." }, { status: 500 });
  }
}

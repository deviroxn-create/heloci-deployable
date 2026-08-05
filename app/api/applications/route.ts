import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createApplication } from "@/services/application.service";

export async function POST(req: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (user.role !== "APPLICANT") {
    return NextResponse.json({ error: "Only applicants can create applications." }, { status: 403 });
  }

  const body = await req.json();
  const programId = typeof body.programId === "string" ? body.programId.trim() : "";
  const programName = typeof body.programName === "string" ? body.programName.trim() : "";

  if (!programId) {
    return NextResponse.json({ error: "Program required" }, { status: 400 });
  }

  try {
    const application = await createApplication(user.id, programId, programName || "Selected program");
    return NextResponse.json({ application });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Unable to create application." }, { status: 500 });
  }
}

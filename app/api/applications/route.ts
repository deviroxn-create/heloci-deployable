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
  const programSlug = body.programSlug as string | undefined;
  const programName = body.programName as string | undefined;

  if (!programSlug || !programName) {
    return NextResponse.json({ error: "Program slug and name are required." }, { status: 400 });
  }

  try {
    const application = await createApplication(user.id, programSlug, programName);
    return NextResponse.json({ application });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Unable to create application." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { EmailService } from "@/lib/email/email.service";
import { createApplication } from "@/services/application.service";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await request.json();
  const programId = body.programId as string | undefined;
  const programName = (body.programName as string | undefined) || (body.programSlug as string | undefined) || "Selected program";
  const payload = body.data as Record<string, unknown> | undefined;

  if (!programId) {
    return NextResponse.json({ error: "Program is required." }, { status: 400 });
  }

  try {
    const application = await createApplication(user.id, programId, programName);

    const emailService = new EmailService();
    await emailService.sendEmail({
      to: user.email,
      template: "application_received",
      data: {
        firstName: user.name || "there",
        applicationId: application.id,
        status: application.status,
        programName
      }
    });

    return NextResponse.json({ success: true, applicationId: application.id, payload });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Unable to create application." }, { status: 500 });
  }
}

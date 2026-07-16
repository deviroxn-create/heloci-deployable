import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { notificationService } from "@/lib/notifications/notification.service";
import { queueTelegramAlert } from "@/lib/telegram/alert-service";
import { validatePage } from "@/lib/forms/validator";
import { getFormForProgram } from "@/lib/forms/renderer";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const payload = (body.data as Record<string, unknown> | undefined) ?? {};

  const application = await prisma.programApplication.findUnique({ where: { id } });
  if (!application || application.userId !== user.id) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const form = await getFormForProgram((await prisma.program.findUnique({ where: { id: application.programId } }))?.slug ?? "", user.id);
  const allQuestions = (form.pages ?? []).flatMap((page) => page.questions);
  const validation = validatePage(allQuestions, payload);
  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  await prisma.programApplication.update({
    where: { id },
    data: {
      status: "submitted",
      submittedAt: new Date(),
      data: { ...((typeof application.data === "object" && application.data !== null ? application.data : {}) as Record<string, unknown>), ...payload } as unknown as Prisma.JsonObject
    }
  });

  await notificationService.notify("application_submitted", { userId: user.id, programId: application.programId, applicationId: application.id });

  try {
    const program = await prisma.program.findUnique({ where: { id: application.programId } });
    await queueTelegramAlert({
      type: 'submitted',
      level: 'INFO',
        organizationId: program?.organizationId ?? undefined,
      data: { applicationId: application.id, programName: program?.name, applicantName: user.name }
    });
  } catch (e) {
    console.error('queueTelegramAlert failed', e);
  }

  return NextResponse.json({ success: true });
}

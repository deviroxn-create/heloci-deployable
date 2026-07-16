import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { notificationService } from "@/lib/notifications/notification.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const pageData = body.pageData as Record<string, unknown> | undefined;
  const currentPage = body.currentPage as number | undefined;

  const application = await prisma.programApplication.findUnique({ where: { id } });
  if (!application || application.userId !== user.id) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const updated = await prisma.programApplication.update({
    where: { id },
    data: {
      data: {
        ...(typeof application.data === "object" && application.data !== null ? (application.data as Record<string, unknown>) : {}),
        ...(pageData ?? {})
      } as unknown as Prisma.JsonObject,
      currentPage: currentPage ?? application.currentPage ?? 0
    }
  });

  if (application.status === "draft") {
    await notificationService.notify("application_started", { userId: user.id, programId: application.programId, applicationId: application.id });
  }

  return NextResponse.json({ success: true, nextPage: updated.currentPage });
}

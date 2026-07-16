import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { requireOrgRole } from "@/lib/auth/rbac";
import { notificationService } from "@/lib/notifications/notification.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const program = await prisma.program.findUnique({ where: { id } });
  if (!program) {
    return NextResponse.json({ error: "Program not found." }, { status: 404 });
  }

  await requireOrgRole(user.id, program.organizationId, ["org_admin"]);

  const body = await req.json();

  await prisma.eligibilityRule.updateMany({
    where: { programId: id, isActive: true },
    data: { isActive: false }
  });

  const rule = await prisma.eligibilityRule.create({
    data: {
      programId: id,
      version: (body.version ?? 1) as number,
      name: body.name ?? "v1",
      rules: body.rules ?? {},
      isActive: true,
      createdBy: user.id
    }
  });

  await notificationService.notify("admin_action", { userId: user.id, recipientEmail: user.email, locale: "en" });

  return NextResponse.json(rule);
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const orgId = user.organizationId;
  if (!orgId) return NextResponse.json({ error: "no_org" }, { status: 400 });

  const members = await prisma.organizationMember.findMany({ where: { organizationId: orgId }, include: { user: true } });
  return NextResponse.json(members);
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const orgId = user.organizationId;
  if (!orgId) return NextResponse.json({ error: "no_org" }, { status: 400 });

  const programs = await prisma.program.findMany({ where: { organizationId: orgId, isArchived: false }, orderBy: { priority: "desc" } });
  return NextResponse.json(programs);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const orgId = user.organizationId;
  if (!orgId) return NextResponse.json({ error: "no_org" }, { status: 400 });

  const body = await req.json();
  try {
    const { createProgram } = await import("@/lib/organizations/dashboard-service");
    const program = await createProgram(orgId, user.id, body);
    return NextResponse.json(program, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
// duplicate admin/global handlers removed in favor of org-scoped handlers above

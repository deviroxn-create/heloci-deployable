import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { updateProgram } from "@/lib/organizations/dashboard-service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { id } = await params;
  const program = await prisma.program.findUnique({ where: { id } });
  if (!program) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (program.organizationId !== user.organizationId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  return NextResponse.json(program);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  try {
    const body = await req.json();
    const { id } = await params;
    const updated = await updateProgram(id, user.id, body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createWorkflowTrigger, listWorkflowTriggers } from "@/lib/workflows/workflow-engine";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const triggers = await listWorkflowTriggers(id);
  return NextResponse.json(triggers);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await req.json();

    try {
    const { id } = await params;
    const trigger = await createWorkflowTrigger(id, user.id, {
      name: body.name,
      event: body.event,
      condition: body.condition,
      action: body.action,
      actionConfig: body.actionConfig,
      isActive: body.isActive,
      order: body.order
    });

    return NextResponse.json(trigger);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Unable to create workflow trigger." }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { publishQuestionSet, validateQuestionSetPayload, getActiveQuestionSet } from "@/lib/programs/question-service";
import { publishDomainEvent } from "@/lib/events/domain-event-publisher";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const questionSet = await getActiveQuestionSet(id);
  return NextResponse.json(questionSet);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const validation = validateQuestionSetPayload(body);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const questionSet = await publishQuestionSet(id, user.id, body);
    publishDomainEvent("admin.action", {
      userId: user.id,
      recipientEmail: user.email,
      locale: "en",
    });
    return NextResponse.json(questionSet);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Unable to save question set." }, { status: 400 });
  }
}

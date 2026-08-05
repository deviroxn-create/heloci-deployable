import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

const progressStore = new Map<string, { currentIndex: number; answers: Record<string, unknown>; userName?: string }>();

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entry = progressStore.get(user.id);
  return NextResponse.json({ currentIndex: entry?.currentIndex ?? 0, answers: entry?.answers ?? {}, userName: user.name ?? user.email ?? undefined });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const currentIndex = typeof body.currentIndex === "number" ? body.currentIndex : 0;
  const answers = typeof body.answers === "object" && body.answers ? body.answers : {};

  progressStore.set(user.id, {
    currentIndex,
    answers: answers as Record<string, unknown>,
    userName: user.name ?? user.email ?? undefined
  });

  return NextResponse.json({
    saved: true,
    currentIndex,
    questionKey: body.questionKey,
    answer: body.answer
  });
}

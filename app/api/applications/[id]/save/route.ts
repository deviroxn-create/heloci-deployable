import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { saveApplicationDraft } from "@/lib/applications/application-service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const pageData = body.pageData as Record<string, unknown> | undefined;
  const currentPage = body.currentPage as number | undefined;

  try {
    const updated = await saveApplicationDraft({
      applicationId: id,
      userId: user.id,
      pageData,
      currentPage,
    });

    return NextResponse.json({ success: true, nextPage: updated.currentPage });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save application.";
    if (message === "Application not found.") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message === "Only draft applications can be saved.") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

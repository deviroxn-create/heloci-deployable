import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ApplicationValidationError, submitApplication } from "@/lib/applications/application-service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;

  const body = await req.json();
  const wizardPayload = (body.data as Record<string, unknown> | undefined) ?? {};

  try {
    await submitApplication({
      applicationId: id,
      userId: user.id,
      wizardPayload,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit application.";
    console.error("❌ [Submit Route] Error:", message);
    if (message === "Application not found.") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (error instanceof ApplicationValidationError) {
      console.error("❌ [Submit Route] Validation failed - check instrumentation above");
      return NextResponse.json({ error: message, errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

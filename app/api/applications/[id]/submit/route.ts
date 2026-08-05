import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { submitApplication } from "@/lib/applications/application-service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // STEP 1: Incoming HTTP Request
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;

  console.log("\n========== SUBMIT PIPELINE TRACE ==========");
  console.log("STEP 1: Incoming HTTP Request");
  console.log(`  Request URL: POST /api/applications/${id}/submit`);
  console.log(`  Authenticated User ID: ${user.id}`);
  console.log(`  User Email: ${user.email}`);
  console.log(`  Application ID: ${id}`);

  const body = await req.json();
  const wizardPayload = (body.data as Record<string, unknown> | undefined) ?? {};
  
  // STEP 2: Raw Wizard Payload
  console.log("\nSTEP 2: Raw Wizard Payload (Before Any Transformation)");
  console.log(`  Total Keys: ${Object.keys(wizardPayload).length}`);
  console.log(`  Keys and Values:`);
  Object.entries(wizardPayload).forEach(([k, v]) => {
    const strVal = JSON.stringify(v);
    const display = strVal.length > 60 ? strVal.substring(0, 60) + '...' : strVal;
    console.log(`    ${k}: ${display} (${typeof v})`);
  });

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
    if (message === "Validation failed") {
      console.error("❌ [Submit Route] Validation failed - check instrumentation above");
      return NextResponse.json({ errors: ["Validation failed"] }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

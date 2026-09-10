import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  ApplicantPropertyInterestError,
  expressApplicantPropertyInterest,
  getApplicantPropertyInterest,
  withdrawApplicantPropertyInterest
} from "@/lib/properties/applicant-property-interest.service";

type RouteContext = { params: Promise<{ programPropertyId: string }> };

function handleError(error: unknown) {
  if (error instanceof ApplicantPropertyInterestError) {
    const status = error.code === "FORBIDDEN" ? 403 : error.code === "UNAVAILABLE" ? 409 : 404;
    return NextResponse.json({ error: error.message }, { status });
  }

  console.error("Applicant property interest error:", error);
  return NextResponse.json({ error: "Unable to update property interest." }, { status: 500 });
}

async function getApplicant() {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  if (user.role !== "APPLICANT") return { response: NextResponse.json({ error: "Applicant access required." }, { status: 403 }) };
  return { user };
}

async function getApplicationId(request: Request) {
  const urlApplicationId = new URL(request.url).searchParams.get("applicationId");
  if (urlApplicationId) return urlApplicationId;

  const body = await request.json().catch(() => null) as { applicationId?: unknown } | null;
  return typeof body?.applicationId === "string" ? body.applicationId : null;
}

export async function POST(request: Request, { params }: RouteContext) {
  const applicant = await getApplicant();
  if (applicant.response) return applicant.response;

  try {
    const { programPropertyId } = await params;
    const applicationId = await getApplicationId(request);
    if (!applicationId) return NextResponse.json({ error: "An application is required." }, { status: 400 });
    const interest = await expressApplicantPropertyInterest(applicant.user.id, applicationId, programPropertyId);
    return NextResponse.json({ interest }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(request: Request, { params }: RouteContext) {
  const applicant = await getApplicant();
  if (applicant.response) return applicant.response;

  try {
    const { programPropertyId } = await params;
    const applicationId = await getApplicationId(request);
    if (!applicationId) return NextResponse.json({ error: "An application is required." }, { status: 400 });
    const interest = await getApplicantPropertyInterest(applicant.user.id, applicationId, programPropertyId);
    return NextResponse.json({ interest });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const applicant = await getApplicant();
  if (applicant.response) return applicant.response;

  try {
    const { programPropertyId } = await params;
    const applicationId = await getApplicationId(request);
    if (!applicationId) return NextResponse.json({ error: "An application is required." }, { status: 400 });
    await withdrawApplicantPropertyInterest(applicant.user.id, applicationId, programPropertyId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleError(error);
  }
}
/**
 * Application Readiness Check API
 * 
 * GET /api/cases/[id]/readiness - Check if application is ready for decision
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getApplicationReadiness } from "@/lib/reviews/decision.service";
import { authorizeCaseRead } from "@/lib/auth/case-authorization";
import { getCaseOrganizationId } from "@/lib/cases/case-service";

/**
 * GET /api/cases/[id]/readiness
 * Get application readiness for decision-making
 * 
 * Returns:
 * {
 *   "isReady": boolean,
 *   "warnings": ["string"],
 *   "recommendations": ["string"],
 *   "checklistCompletion": number (0-100),
 *   "documentsVerified": number,
 *   "documentsTotal": number
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    const applicationId = id;

    if (!applicationId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_APPLICATION_ID",
            message: "Application ID is required",
          },
        },
        { status: 400 }
      );
    }

    const organizationId = await getCaseOrganizationId(applicationId);
    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "APPLICATION_NOT_FOUND",
            message: "Application not found",
          },
        },
        { status: 404 }
      );
    }

    await authorizeCaseRead(organizationId);

    // Get readiness check
    const readiness = await getApplicationReadiness(applicationId);

    return NextResponse.json({
      success: true,
      data: readiness,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while checking application readiness",
          details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
      },
      { status: 500 }
    );
  }
}

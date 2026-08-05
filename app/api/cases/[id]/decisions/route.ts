/**
 * Decision API Routes
 * 
 * POST /api/cases/[id]/decisions - Make a decision
 * GET /api/cases/[id]/decisions - Get decision history
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  approveApplication,
  conditionallyApproveApplication,
  rejectApplication,
  waitlistApplication,
  escalateApplication,
  requestAdditionalInfo,
  withdrawApplication,
  closeCase,
  getDecisionHistory,
  getLatestDecision,
  getApplicationReadiness,
} from "@/lib/reviews/decision.service";
import type {
  ApproveDecisionInput,
  ConditionalApprovalInput,
  RejectDecisionInput,
  WaitlistDecisionInput,
  EscalateDecisionInput,
  RequestAdditionalInfoInput,
  WithdrawDecisionInput,
  CloseDecisionInput,
  DecisionType,
} from "@/lib/reviews/decision.types";
import { authorizeCaseDecision, authorizeCaseRead } from "@/lib/auth/case-authorization";
import { getCaseOrganizationId } from "@/lib/cases/case-service";

/**
 * POST /api/cases/[id]/decisions
 * Make a reviewer decision (approve, reject, waitlist, etc.)
 * 
 * Request body varies by decision type:
 * {
 *   "decisionType": "approve|reject|conditional|waitlist|escalate|needs_info|withdraw|close",
 *   "reason": "string (required for some types)",
 *   "conditions": ["string"] (required for conditional_approval),
 *   "informationNeeded": ["string"] (required for needs_info),
 *   "escalateToUserId": "string" (optional for escalate),
 *   "effectiveDate": "ISO date string" (optional),
 *   "expirationDate": "ISO date string" (optional for conditional/info),
 *   "applicantMessage": "string" (optional),
 *   "internalNotes": "string" (optional),
 *   "templateId": "string" (optional),
 *   "instructions": "string" (optional for needs_info),
 *   "withdrawnByApplicant": boolean (optional for withdraw)
 * }
 */
export async function POST(
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

    const body = await request.json();
    const { decisionType, ...decisionData } = body;

    if (!decisionType) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DECISION_TYPE_REQUIRED",
            message: "Decision type is required",
          },
        },
        { status: 400 }
      );
    }

    // Validate decision type
    const validDecisionTypes = [
      "approved",
      "conditional_approval",
      "rejected",
      "waitlisted",
      "escalated",
      "needs_info",
      "withdrawn",
      "closed",
    ];

    if (!validDecisionTypes.includes(decisionType)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_DECISION_TYPE",
            message: `Invalid decision type. Must be one of: ${validDecisionTypes.join(", ")}`,
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

    await authorizeCaseDecision(organizationId);

    // Route to appropriate decision handler
    let result;

    switch (decisionType) {
      case "approved":
        result = await approveApplication({
          applicationId,
          staffUserId: user.id,
          ...decisionData,
          effectiveDate: decisionData.effectiveDate
            ? new Date(decisionData.effectiveDate)
            : undefined,
        } as ApproveDecisionInput);
        break;

      case "conditional_approval":
        // Validate required fields
        if (!decisionData.conditions || !Array.isArray(decisionData.conditions)) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "CONDITIONS_REQUIRED",
                message: "Conditions array is required for conditional approval",
              },
            },
            { status: 400 }
          );
        }
        if (!decisionData.applicantMessage) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "APPLICANT_MESSAGE_REQUIRED",
                message: "Applicant message is required for conditional approval",
              },
            },
            { status: 400 }
          );
        }

        result = await conditionallyApproveApplication({
          applicationId,
          staffUserId: user.id,
          conditions: decisionData.conditions,
          applicantMessage: decisionData.applicantMessage,
          expirationDate: decisionData.expirationDate
            ? new Date(decisionData.expirationDate)
            : undefined,
          internalNotes: decisionData.internalNotes,
          templateId: decisionData.templateId,
        } as ConditionalApprovalInput);
        break;

      case "rejected":
        // Validate required fields
        if (!decisionData.reason) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "REASON_REQUIRED",
                message: "Rejection reason is required",
              },
            },
            { status: 400 }
          );
        }

        result = await rejectApplication({
          applicationId,
          staffUserId: user.id,
          reason: decisionData.reason,
          applicantMessage: decisionData.applicantMessage,
          internalNotes: decisionData.internalNotes,
          templateId: decisionData.templateId,
        } as RejectDecisionInput);
        break;

      case "waitlisted":
        result = await waitlistApplication({
          applicationId,
          staffUserId: user.id,
          reason: decisionData.reason,
          expectedReviewDate: decisionData.expectedReviewDate
            ? new Date(decisionData.expectedReviewDate)
            : undefined,
          applicantMessage: decisionData.applicantMessage,
          templateId: decisionData.templateId,
        } as WaitlistDecisionInput);
        break;

      case "escalated":
        // Validate required fields
        if (!decisionData.reason) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "REASON_REQUIRED",
                message: "Escalation reason is required",
              },
            },
            { status: 400 }
          );
        }

        result = await escalateApplication({
          applicationId,
          staffUserId: user.id,
          reason: decisionData.reason,
          escalateToUserId: decisionData.escalateToUserId,
          applicantMessage: decisionData.applicantMessage,
          internalNotes: decisionData.internalNotes,
        } as EscalateDecisionInput);
        break;

      case "needs_info":
        // Validate required fields
        if (
          !decisionData.informationNeeded ||
          !Array.isArray(decisionData.informationNeeded)
        ) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "INFORMATION_NEEDED_REQUIRED",
                message: "Information needed array is required",
              },
            },
            { status: 400 }
          );
        }

        result = await requestAdditionalInfo({
          applicationId,
          staffUserId: user.id,
          informationNeeded: decisionData.informationNeeded,
          deadline: decisionData.deadline
            ? new Date(decisionData.deadline)
            : undefined,
          instructions: decisionData.instructions,
          applicantMessage: decisionData.applicantMessage,
          internalNotes: decisionData.internalNotes,
          templateId: decisionData.templateId,
        } as RequestAdditionalInfoInput);
        break;

      case "withdrawn":
        // Validate required fields
        if (!decisionData.reason) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "REASON_REQUIRED",
                message: "Withdrawal reason is required",
              },
            },
            { status: 400 }
          );
        }

        result = await withdrawApplication({
          applicationId,
          staffUserId: user.id,
          reason: decisionData.reason,
          applicantMessage: decisionData.applicantMessage,
          internalNotes: decisionData.internalNotes,
          withdrawnByApplicant: decisionData.withdrawnByApplicant,
        } as WithdrawDecisionInput);
        break;

      case "closed":
        // Validate required fields
        if (!decisionData.reason) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "REASON_REQUIRED",
                message: "Closure reason is required",
              },
            },
            { status: 400 }
          );
        }

        result = await closeCase({
          applicationId,
          staffUserId: user.id,
          reason: decisionData.reason,
          internalNotes: decisionData.internalNotes || decisionData.finalNotes,
        } as CloseDecisionInput);
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_DECISION_TYPE",
              message: `Unsupported decision type: ${decisionType}`,
            },
          },
          { status: 400 }
        );
    }

    // Handle result
    if (!result.success) {
      // Parse error message to determine HTTP status
      let statusCode = 400;
      if (result.error?.includes("not found")) {
        statusCode = 404;
      } else if (result.error?.includes("permission") || result.error?.includes("not authorized")) {
        statusCode = 403;
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DECISION_FAILED",
            message: result.error || "Failed to make decision",
          },
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        decisionId: result.decisionId,
        decisionType,
        message: result.message,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while processing your decision",
          details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cases/[id]/decisions
 * Get decision history for an application
 * 
 * Query parameters:
 * - limit: number (optional, default 50)
 * - latest: boolean (optional, get only latest decision)
 * - readiness: boolean (optional, check application readiness)
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

    const { searchParams } = new URL(request.url);
    const latest = searchParams.get("latest") === "true";
    const readiness = searchParams.get("readiness") === "true";

    // Prepare response data
    const data: any = {};

    // Get decision history or latest decision
    if (latest) {
      const latestDecision = await getLatestDecision(applicationId);
      data.decision = latestDecision;
    } else {
      const history = await getDecisionHistory(applicationId);
      data.decisions = history;
    }

    // Optionally include readiness check
    if (readiness) {
      data.readiness = await getApplicationReadiness(applicationId);
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Check if it's a "not found" error
    if (errorMessage.includes("not found")) {
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

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while retrieving decision history",
          details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
      },
      { status: 500 }
    );
  }
}

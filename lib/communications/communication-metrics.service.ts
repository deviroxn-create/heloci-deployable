/**
 * COMMUNICATION METRICS SERVICE - Phase 1.6 Polish
 * 
 * Dashboard widgets for communication analytics.
 * Reuses NotificationLog, CaseMessage, DocumentRequest.
 */

import { prisma } from "@/lib/prisma/client";
import { CommunicationScope, getOperationOrganizationId, getScopeFilter } from "@/lib/communications/scope.service";

export interface CommunicationMetrics {
  messagesToday: number;
  emailsSent: number;
  replyRate: number;
  averageResponseTime: number;
  openConversations: number;
  failedEmails: number;
  pendingDocuments: number;
  mostActiveStaff: Array<{
    name: string;
    email: string;
    messageCount: number;
    emailCount: number;
  }>;
}

/**
 * Get communication metrics for dashboard
 */
export async function getCommunicationMetrics(
  scope: CommunicationScope,
  userId: string,
  period: "today" | "week" | "month" = "today"
): Promise<CommunicationMetrics> {
  const organizationId = getOperationOrganizationId(scope);
  if (!organizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  const messageScopeFilter = getScopeFilter(scope, "conversation.programApplication.program.organizationId");
  const applicationScopeFilter = getScopeFilter(scope, "programApplication.program.organizationId");
  const documentScopeFilter = getScopeFilter(scope, "application.program.organizationId");
  const organizationFilter = getScopeFilter(scope, "organizationId");

  // Calculate date range
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  // Fetch all metrics in parallel
  const [
    messagesToday,
    emailsSent,
    openConversations,
    failedEmails,
    pendingDocuments,
    mostActiveStaff
  ] = await Promise.all([
    // Messages today
    prisma.caseMessage.count({
      where: {
        ...messageScopeFilter,
        createdAt: { gte: startDate }
      }
    }),

    // Emails sent
    prisma.notificationLog.count({
      where: {
        channel: "email",
        userId: userId,
        createdAt: { gte: startDate },
        deliveryStatus: { in: ["SENT", "DELIVERED", "READ"] }
      }
    }),

    // Open conversations (applications in progress)
    prisma.caseConversation.count({
      where: {
        programApplication: {
          ...(applicationScopeFilter.programApplication ?? {}),
          status: { in: ["pending", "under_review", "more_info_requested"] }
        }
      }
    }),

    // Failed emails
    prisma.notificationLog.count({
      where: {
        channel: "email",
        deliveryStatus: "FAILED"
      }
    }),

    // Pending documents
    prisma.documentRequest.count({
      where: {
        application: {
          ...(documentScopeFilter.application ?? {}),
          status: "pending",
          expiresAt: { gt: now }
        }
      }
    }),

    // Most active staff
    (async () => {
      const staff = await prisma.organizationMember.findMany({
        where: { ...organizationFilter },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              _count: {
                select: {
                  sentCaseMessages: {
                    where: {
                      createdAt: { gte: startDate }
                    }
                  },
                  notificationLogs: {
                    where: {
                      channel: "email",
                      createdAt: { gte: startDate }
                    }
                  }
                }
              }
            }
          }
        }
      });

      return staff
        .map(member => ({
          name: member.user.name || member.user.email,
          email: member.user.email,
          messageCount: member.user._count.sentCaseMessages,
          emailCount: member.user._count.notificationLogs
        }))
        .sort(
          (a, b) => (b.messageCount + b.emailCount) - (a.messageCount + a.emailCount)
        )
        .slice(0, 5);
    })()
  ]);

  // Calculate reply rate (messages where staff replied to applicant within 24h)
  const replyRate = await calculateReplyRate(organizationId, startDate);

  // Calculate average response time
  const avgResponseTime = await calculateAverageResponseTime(organizationId, startDate);

  return {
    messagesToday,
    emailsSent,
    replyRate,
    averageResponseTime: avgResponseTime,
    openConversations,
    failedEmails,
    pendingDocuments,
    mostActiveStaff
  };
}

/**
 * Calculate reply rate (% of applicant messages that received staff response within 24h)
 */
async function calculateReplyRate(organizationId: string, since: Date): Promise<number> {
  const conversations = await prisma.caseConversation.findMany({
    where: {
      programApplication: {
        program: { organizationId }
      }
    },
    include: {
      messages: {
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (conversations.length === 0) return 0;

  let replied = 0;
  let total = 0;

  conversations.forEach(conv => {
    let lastApplicantMessage: any = null;

    conv.messages.forEach(msg => {
      if (msg.senderRole === "applicant") {
        lastApplicantMessage = msg;
        total++;
      } else if (lastApplicantMessage) {
        const timeDiff = msg.createdAt.getTime() - lastApplicantMessage.createdAt.getTime();
        if (timeDiff < 24 * 60 * 60 * 1000) { // Within 24 hours
          replied++;
        }
        lastApplicantMessage = null;
      }
    });
  });

  return total === 0 ? 0 : Math.round((replied / total) * 100);
}

/**
 * Calculate average response time (hours)
 */
async function calculateAverageResponseTime(organizationId: string, since: Date): Promise<number> {
  const conversations = await prisma.caseConversation.findMany({
    where: {
      programApplication: {
        program: { organizationId }
      }
    },
    include: {
      messages: {
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: "asc" }
      }
    }
  });

  let totalTime = 0;
  let responseCount = 0;

  conversations.forEach(conv => {
    for (let i = 0; i < conv.messages.length - 1; i++) {
      const current = conv.messages[i];
      const next = conv.messages[i + 1];

      // Only count if sender role changes (someone different responded)
      if (current.senderRole !== next.senderRole) {
        const timeDiff = next.createdAt.getTime() - current.createdAt.getTime();
        totalTime += timeDiff;
        responseCount++;
      }
    }
  });

  if (responseCount === 0) return 0;
  return Math.round((totalTime / responseCount) / (1000 * 60 * 60)); // Convert to hours
}

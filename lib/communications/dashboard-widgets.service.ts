/**
 * DASHBOARD WIDGETS SERVICE - Communication Center
 * 
 * Phase 1.5: Dashboard inbox widgets for staff and admin
 * Reuses existing NotificationLog, CaseConversation, and CaseMessage
 * No duplicate queries - all data comes from existing APIs
 */

import { prisma } from "@/lib/prisma/client";
import { CommunicationScope, getOperationOrganizationId, getScopeFilter } from "@/lib/communications/scope.service";

export interface InboxWidgetStats {
  unreadInternalMessages: number;
  recentEmailsSent: number;
  draftCount: number;
  failedEmails: number;
  pendingDocumentRequests: number;
}

/**
 * Get inbox dashboard widgets for staff
 * All data from existing queries - zero duplication
 */
export async function getInboxWidgetStats(
  userId: string,
  scope: CommunicationScope
): Promise<InboxWidgetStats> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [unreadMessages, sentEmailsToday, draftCount, failedEmails, pendingDocuments] = await Promise.all([
    // 1. Unread internal messages from case conversations
    (async () => {
      const conversations = await prisma.caseConversation.findMany({
        where: {
          programApplication: {
            program: getScopeFilter(scope, "program.organizationId")
          }
        },
        include: {
          messages: {
            where: {
              senderId: { not: userId },
              read: false
            }
          }
        }
      });
      return conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
    })(),

    // 2. Recent emails sent today
    (async () => {
      return prisma.notificationLog.count({
        where: {
          channel: "email",
          userId,
          createdAt: { gte: todayStart },
          deliveryStatus: { in: ["SENT", "DELIVERED", "READ"] }
        }
      });
    })(),

    // 3. Draft count
    (async () => {
      return prisma.emailDraft.count({
        where: {
          ...getScopeFilter(scope, "organizationId"),
          authorId: userId
        }
      });
    })(),

    // 4. Failed emails
    (async () => {
      return prisma.notificationLog.count({
        where: {
          channel: "email",
          userId,
          deliveryStatus: "FAILED"
        }
      });
    })(),

    // 5. Pending document requests
    (async () => {
      return prisma.documentRequest.count({
        where: {
          application: {
            program: getScopeFilter(scope, "program.organizationId")
          },
          status: "pending",
          expiresAt: { gt: now }
        }
      });
    })()
  ]);

  return {
    unreadInternalMessages: unreadMessages,
    recentEmailsSent: sentEmailsToday,
    draftCount,
    failedEmails,
    pendingDocumentRequests: pendingDocuments
  };
}

/**
 * Get email delivery rate for dashboard widget
 * Reuses NotificationLog
 */
export async function getEmailDeliveryRate(
  scope: CommunicationScope,
  userId: string,
  daysBack: number = 7
): Promise<{
  total: number;
  delivered: number;
  failed: number;
  rate: number;
}> {
  const operationOrganizationId = getOperationOrganizationId(scope);
  if (!operationOrganizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  const [stats] = await prisma.notificationLog.groupBy({
    by: ["deliveryStatus"],
    where: {
      channel: "email",
      userId,
      createdAt: { gte: since }
    },
    _count: { deliveryStatus: true }
  }).then(groups => {
    const result: Record<string, number> = {};
    groups.forEach(g => {
      result[g.deliveryStatus] = g._count.deliveryStatus;
    });
    
    const total = Object.values(result).reduce((sum, count) => sum + count, 0);
    const delivered = (result["DELIVERED"] || 0) + (result["READ"] || 0);
    const failed = result["FAILED"] || 0;
    const rate = total === 0 ? 0 : (delivered / total) * 100;

    return [{ total, delivered, failed, rate }];
  });

  return {
    total: stats?.total || 0,
    delivered: stats?.delivered || 0,
    failed: stats?.failed || 0,
    rate: stats?.rate || 0
  };
}

/**
 * Get internal messages sent today
 * For dashboard widget
 */
export async function getInternalMessagesToday(
  scope: CommunicationScope,
  userId: string
): Promise<number> {
  const operationOrganizationId = getOperationOrganizationId(scope);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return prisma.caseMessage.count({
    where: {
      senderId: userId,
      senderRole: "staff",
      conversation: {
        programApplication: {
          program: getScopeFilter(scope, "program.organizationId")
        }
      },
      createdAt: { gte: todayStart }
    }
  });
}

/**
 * Get failed emails for dashboard widget
 */
export async function getFailedEmails(
  scope: CommunicationScope,
  userId: string
): Promise<Array<{
  id: string;
  recipient: string | null;
  subject: string | null;
  errorMessage: string | null;
  sentAt: Date | null;
}>> {
  const operationOrganizationId = getOperationOrganizationId(scope);
  if (!operationOrganizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  return prisma.notificationLog.findMany({
    where: {
      channel: "email",
      userId,
      deliveryStatus: "FAILED"
    },
    select: {
      id: true,
      recipient: true,
      subject: true,
      errorMessage: true,
      sentAt: true
    },
    orderBy: { createdAt: "desc" },
    take: 10
  });
}

/**
 * Calculate average reply time for open conversations
 * For dashboard widget
 */
export async function getAverageReplyTime(
  scope: CommunicationScope,
  userId: string
): Promise<number> {
  const operationOrganizationId = getOperationOrganizationId(scope);

  // Get all conversations for org
  const conversations = await prisma.caseConversation.findMany({
    where: {
      programApplication: {
        program: getScopeFilter(scope, "program.organizationId")
      }
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  // Calculate average reply time
  let totalReplyTime = 0;
  let replyCount = 0;

  conversations.forEach(conv => {
    for (let i = 0; i < conv.messages.length - 1; i++) {
      const current = conv.messages[i];
      const next = conv.messages[i + 1];

      // Only count if sender role changes (different person responded)
      if (current.senderRole !== next.senderRole) {
        const replyTime = next.createdAt.getTime() - current.createdAt.getTime();
        totalReplyTime += replyTime;
        replyCount++;
      }
    }
  });

  // Return average in hours
  return replyCount === 0 ? 0 : (totalReplyTime / replyCount) / (1000 * 60 * 60);
}

/**
 * Get open conversations for dashboard widget
 */
export async function getOpenConversations(
  scope: CommunicationScope,
  userId: string
): Promise<number> {
  const operationOrganizationId = getOperationOrganizationId(scope);
  if (!operationOrganizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  return prisma.caseConversation.count({
    where: {
      programApplication: {
        program: getScopeFilter(scope, "program.organizationId"),
        status: { in: ["pending", "under_review", "more_info_requested"] }
      }
    }
  });
}

/**
 * Get sender identity statistics for dashboard
 */
export async function getSenderIdentityStats(
  scope: CommunicationScope,
  userId: string,
  daysBack: number = 30
): Promise<{
  topSenders: Array<{
    id: string;
    displayName: string;
    emailAddress: string;
    sentCount: number;
    deliveredCount: number;
    failedCount: number;
    deliveryRate: number;
  }>;
  totalSenders: number;
  activeSenders: number;
  verifiedSenders: number;
}> {
  const operationOrganizationId = getOperationOrganizationId(scope);
  if (!operationOrganizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  // Get all senders for organization
  const senders = await prisma.senderIdentity.findMany({
    where: getScopeFilter(scope, "organizationId"),
    select: {
      id: true,
      displayName: true,
      emailAddress: true,
      isActive: true,
      verificationStatus: true
    }
  });

  // Get usage stats for each sender
  const topSenders = await Promise.all(
    senders.map(async (sender) => {
      const [sent, delivered, failed] = await Promise.all([
        prisma.notificationLog.count({
          where: {
            senderIdentityId: sender.id,
            createdAt: { gte: since }
          }
        }),
        prisma.notificationLog.count({
          where: {
            senderIdentityId: sender.id,
            deliveryStatus: { in: ["DELIVERED", "READ"] },
            createdAt: { gte: since }
          }
        }),
        prisma.notificationLog.count({
          where: {
            senderIdentityId: sender.id,
            deliveryStatus: "FAILED",
            createdAt: { gte: since }
          }
        })
      ]);

      return {
        id: sender.id,
        displayName: sender.displayName,
        emailAddress: sender.emailAddress,
        sentCount: sent,
        deliveredCount: delivered,
        failedCount: failed,
        deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0
      };
    })
  );

  // Sort by sent count and take top 5
  const sortedTop = topSenders
    .sort((a, b) => b.sentCount - a.sentCount)
    .slice(0, 5);

  return {
    topSenders: sortedTop,
    totalSenders: senders.length,
    activeSenders: senders.filter(s => s.isActive).length,
    verifiedSenders: senders.filter(s => s.verificationStatus === "VERIFIED").length
  };
}

/**
 * Get sender performance breakdown by sender identity
 */
export async function getSenderPerformanceBreakdown(
  scope: CommunicationScope,
  userId: string,
  senderId?: string,
  daysBack: number = 30
): Promise<{
  senderId: string;
  senderName: string;
  senderEmail: string;
  metrics: {
    totalSent: number;
    delivered: number;
    failed: number;
    pending: number;
    read: number;
    deliveryRate: number;
    openRate: number;
  };
  dailyBreakdown: Array<{
    date: string;
    sent: number;
    delivered: number;
    failed: number;
  }>;
}> {
  const operationOrganizationId = getOperationOrganizationId(scope);
  if (!operationOrganizationId) {
    throw new Error("INVALID_SCOPE: Organization context required");
  }

  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  // Get sender info
  const sender = senderId
    ? await prisma.senderIdentity.findFirst({
        where: { id: senderId, ...getScopeFilter(scope, "organizationId") }
      })
    : await prisma.senderIdentity.findFirst({
        where: { ...getScopeFilter(scope, "organizationId"), isDefault: true }
      });

  if (!sender) {
    throw new Error("Sender not found");
  }

  // Get overall metrics
  const [totalSent, delivered, failed, pending, read] = await Promise.all([
    prisma.notificationLog.count({
      where: {
        senderIdentityId: sender.id,
        createdAt: { gte: since }
      }
    }),
    prisma.notificationLog.count({
      where: {
        senderIdentityId: sender.id,
        deliveryStatus: "DELIVERED",
        createdAt: { gte: since }
      }
    }),
    prisma.notificationLog.count({
      where: {
        senderIdentityId: sender.id,
        deliveryStatus: "FAILED",
        createdAt: { gte: since }
      }
    }),
    prisma.notificationLog.count({
      where: {
        senderIdentityId: sender.id,
        deliveryStatus: { in: ["PENDING", "QUEUED"] },
        createdAt: { gte: since }
      }
    }),
    prisma.notificationLog.count({
      where: {
        senderIdentityId: sender.id,
        deliveryStatus: "READ",
        createdAt: { gte: since }
      }
    })
  ]);

  const deliveryRate = totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 0;
  const openRate = delivered > 0 ? Math.round((read / delivered) * 100) : 0;

  // Get daily breakdown
  const logs = await prisma.notificationLog.findMany({
    where: {
      senderIdentityId: sender.id,
      createdAt: { gte: since }
    },
    select: {
      createdAt: true,
      deliveryStatus: true
    }
  });

  // Group by date
  const dailyMap = new Map<string, { sent: number; delivered: number; failed: number }>();
  
  logs.forEach(log => {
    const date = log.createdAt.toISOString().split("T")[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { sent: 0, delivered: 0, failed: 0 });
    }
    const day = dailyMap.get(date)!;
    day.sent++;
    if (log.deliveryStatus === "DELIVERED" || log.deliveryStatus === "READ") {
      day.delivered++;
    }
    if (log.deliveryStatus === "FAILED") {
      day.failed++;
    }
  });

  const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, stats]) => ({
    date,
    ...stats
  }));

  return {
    senderId: sender.id,
    senderName: sender.displayName,
    senderEmail: sender.emailAddress,
    metrics: {
      totalSent,
      delivered,
      failed,
      pending,
      read,
      deliveryRate,
      openRate
    },
    dailyBreakdown
  };
}

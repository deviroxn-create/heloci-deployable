import { prisma } from "@/lib/prisma/client";

export async function getNotificationLogById(notificationId: string) {
  return prisma.notificationLog.findUnique({
    where: { id: notificationId },
    include: {
      retryAttempts: {
        orderBy: { createdAt: "desc" }
      }
    }
  });
}

export async function getNotificationOwnerOrgId(userId: string) {
  const owner = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true }
  });

  return owner?.organizationId || null;
}

export async function getApplicationDeliveryData(applicationId: string, page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  const [notifications, caseMessages, total] = await Promise.all([
    prisma.notificationLog.findMany({
      where: {
        payload: {
          path: ["applicationId"],
          equals: applicationId
        }
      },
      select: {
        id: true,
        eventName: true,
        channel: true,
        recipient: true,
        sender: true,
        subject: true,
        deliveryStatus: true,
        createdAt: true,
        sentAt: true,
        deliveredAt: true,
        readAt: true,
        errorMessage: true,
        retryCount: true,
        maxRetries: true,
        senderIdentity: {
          select: {
            id: true,
            displayName: true,
            emailAddress: true,
            department: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize / 2
    }),
    prisma.caseMessage.findMany({
      where: {
        conversation: {
          applicationId
        }
      },
      select: {
        id: true,
        content: true,
        senderRole: true,
        read: true,
        readAt: true,
        createdAt: true,
        sender: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" },
      skip: Math.floor(skip / 2),
      take: Math.floor(pageSize / 2)
    }),
    prisma.notificationLog.count({
      where: {
        payload: {
          path: ["applicationId"],
          equals: applicationId
        }
      }
    })
  ]);

  return { notifications, caseMessages, total };
}

export async function getNotificationDeliveryMetrics(organizationFilter: any) {
  const statuses = await prisma.notificationLog.groupBy({
    by: ["deliveryStatus"],
    where: {
      user: organizationFilter
    },
    _count: true
  });

  const statusMap = new Map<string, number>();
  let total = 0;

  statuses.forEach((s) => {
    statusMap.set(s.deliveryStatus, s._count);
    total += s._count;
  });

  const pending = statusMap.get("PENDING") || 0;
  const queued = statusMap.get("QUEUED") || 0;
  const sent = statusMap.get("SENT") || 0;
  const delivered = statusMap.get("DELIVERED") || 0;
  const read = statusMap.get("READ") || 0;
  const failed = statusMap.get("FAILED") || 0;
  const cancelled = statusMap.get("CANCELLED") || 0;
  const retrying = await prisma.notificationLog.count({
    where: {
      user: organizationFilter,
      retryCount: { gt: 0 },
      deliveryStatus: { not: "DELIVERED" }
    }
  });

  return { total, pending, queued, sent, delivered, read, failed, cancelled, retrying };
}

export async function getFailedNotificationsForOrg(organizationFilter: any, limit: number) {
  return prisma.notificationLog.findMany({
    where: {
      deliveryStatus: "FAILED",
      user: organizationFilter
    },
    select: {
      id: true,
      eventName: true,
      channel: true,
      recipient: true,
      subject: true,
      errorMessage: true,
      createdAt: true,
      sentAt: true,
      retryCount: true,
      maxRetries: true,
      nextRetryAt: true
    },
    orderBy: { createdAt: "desc" },
    take: limit
  });
}

export async function createRetryAttempt(notificationId: string, previousStatus: string, previousError: string | null) {
  await prisma.notificationRetryAttempt.create({
    data: {
      notificationLogId: notificationId,
      attempt: 0,
      status: previousStatus as any,
      errorMessage: previousError
    }
  });
}

export async function getApplicationDeliveryRecord(applicationId: string) {
  return prisma.programApplication.findUnique({
    where: { id: applicationId },
    select: {
      program: { select: { organizationId: true } }
    }
  });
}

export async function getNotificationDeliveryRecord(notificationId: string) {
  return prisma.notificationLog.findUnique({
    where: { id: notificationId }
  });
}

export async function getNotificationDeliveryHistory(organizationFilter: any, filters: any, skip: number, pageSize: number) {
  const where: any = { user: organizationFilter };

  if (filters.status) where.deliveryStatus = filters.status;
  if (filters.channel) where.channel = filters.channel;
  if (filters.recipient) {
    where.recipient = { contains: filters.recipient, mode: "insensitive" };
  }
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }
  if (filters.hasErrors === true) {
    where.errorMessage = { not: null };
  }

  return prisma.notificationLog.findMany({
    where,
    select: {
      id: true,
      eventName: true,
      channel: true,
      recipient: true,
      subject: true,
      deliveryStatus: true,
      createdAt: true,
      sentAt: true,
      deliveredAt: true,
      errorMessage: true,
      retryCount: true
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: pageSize
  });
}

export async function countNotificationDeliveryHistory(organizationFilter: any, filters: any) {
  const where: any = { user: organizationFilter };

  if (filters.status) where.deliveryStatus = filters.status;
  if (filters.channel) where.channel = filters.channel;
  if (filters.recipient) {
    where.recipient = { contains: filters.recipient, mode: "insensitive" };
  }
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }
  if (filters.hasErrors === true) {
    where.errorMessage = { not: null };
  }

  return prisma.notificationLog.count({ where });
}

export async function getNotificationDeliveryRecords(organizationFilter: any) {
  return prisma.notificationLog.findMany({
    where: {
      deliveryStatus: "FAILED",
      retryCount: { lt: 5 },
      user: organizationFilter
    }
  });
}

export async function updateNotificationDeliveryStatus(notificationId: string) {
  return prisma.notificationLog.update({
    where: { id: notificationId },
    data: {
      deliveryStatus: "QUEUED",
      retryCount: { increment: 1 },
      errorMessage: null,
      nextRetryAt: new Date()
    }
  });
}

export async function retryNotificationDelivery(notificationId: string) {
  return prisma.notificationLog.update({
    where: { id: notificationId },
    data: {
      deliveryStatus: "QUEUED",
      retryCount: { increment: 1 },
      errorMessage: null,
      nextRetryAt: new Date()
    }
  });
}

export async function updateNotificationDeliveryRecord(notificationId: string) {
  return prisma.notificationLog.update({
    where: { id: notificationId },
    data: {
      deliveryStatus: "CANCELLED"
    }
  });
}

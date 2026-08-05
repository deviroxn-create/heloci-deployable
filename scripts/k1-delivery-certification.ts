import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { notificationService } from "../lib/notifications/notification.service";
import { registerUserAccount } from "../lib/auth/user-profile.service";
import { prisma } from "../lib/prisma/client";

const FIXTURE_EMAIL = process.env.K1_CERTIFICATION_EMAIL || "k1-delivery-certification@resend.dev";
const FIXTURE_NAME = "Heloci K1 Delivery Certifier";
const CERTIFICATION_EVENT = "user_registration" as const;

async function main() {
  const existingUser = await prisma.user.findUnique({ where: { email: FIXTURE_EMAIL } });
  const fixtureUser = existingUser ?? await registerUserAccount({ email: FIXTURE_EMAIL, name: FIXTURE_NAME });
  const createdFixture = !existingUser;

  console.log("---CERTIFICATION FIXTURE USER---");
  console.log(JSON.stringify({ id: fixtureUser.id, email: fixtureUser.email, role: fixtureUser.role, name: fixtureUser.name, createdFixture }, null, 2));

  const beforeExplicitNotifyLogCount = await prisma.notificationLog.count({
    where: { userId: fixtureUser.id, eventName: CERTIFICATION_EVENT }
  });
  const beforeExplicitNotifyTimelineCount = await prisma.communicationTimelineEntry.count({
    where: { userId: fixtureUser.id, eventName: CERTIFICATION_EVENT }
  });

  const payload = {
    recipientEmail: fixtureUser.email,
    recipient: fixtureUser.email,
    userEmail: fixtureUser.email,
    userId: fixtureUser.id,
    name: fixtureUser.name,
    organizationAdminId: process.env.K1_CERTIFICATION_ADMIN_ID || "admin-1",
    organizationAdminEmail: process.env.K1_CERTIFICATION_ADMIN_EMAIL || "admin@heloci.ngo"
  };

  console.log("---CERTIFICATION INPUT---");
  console.log(JSON.stringify({
    event: CERTIFICATION_EVENT,
    fixtureUserId: fixtureUser.id,
    fixtureUserEmail: fixtureUser.email,
    provider: process.env.RESEND_API_KEY ? "resend" : "missing",
    senderEmail: process.env.COMMUNICATION_SENDER_EMAIL || "missing",
    resendConfigured: Boolean(process.env.RESEND_API_KEY),
    telegramConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
  }, null, 2));

  console.log("---NOTIFICATION CALL---");
  const result = await notificationService.notify(CERTIFICATION_EVENT, payload as any);
  console.log("---NOTIFICATION RESULT---");
  console.log(JSON.stringify(result, null, 2));

  const logs = await prisma.notificationLog.findMany({
    where: { userId: fixtureUser.id, eventName: CERTIFICATION_EVENT },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  const timelineEntries = await prisma.communicationTimelineEntry.findMany({
    where: { userId: fixtureUser.id, eventName: CERTIFICATION_EVENT },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  console.log("---CERTIFICATION VERIFICATION---");
  console.log(JSON.stringify({
    beforeExplicitNotifyLogCount,
    afterExplicitNotifyLogCount: logs.length,
    explicitNotifyNewLogCount: logs.length - beforeExplicitNotifyLogCount,
    beforeExplicitNotifyTimelineCount,
    afterExplicitNotifyTimelineCount: timelineEntries.length,
    explicitNotifyNewTimelineCount: timelineEntries.length - beforeExplicitNotifyTimelineCount,
    persistedUserId: fixtureUser.id,
    logUserIdConsistent: logs.every((log) => log.userId === fixtureUser.id),
    timelineUserIdConsistent: timelineEntries.every((entry) => entry.userId === fixtureUser.id)
  }, null, 2));

  console.log("---LATEST LOG RECORDS---");
  console.log(JSON.stringify(logs.map((log) => ({ id: log.id, channel: log.channel, deliveryStatus: log.deliveryStatus, recipient: log.recipient, templateUsed: log.templateUsed, createdAt: log.createdAt, errorMessage: log.errorMessage })), null, 2));

  console.log("---LATEST TIMELINE RECORDS---");
  console.log(JSON.stringify(timelineEntries.map((entry) => ({ id: entry.id, title: entry.title, details: entry.details, createdAt: entry.createdAt })), null, 2));

  const duplicateLogUserCheck = logs.some((log) => log.userId !== fixtureUser.id);
  const duplicateTimelineUserCheck = timelineEntries.some((entry) => entry.userId !== fixtureUser.id);

  if (duplicateLogUserCheck || duplicateTimelineUserCheck) {
    throw new Error("Persistence verification failed: found log or timeline entry with mismatched userId");
  }

  if (!result.delivered) {
    throw new Error("Notification result reported not delivered; check provider or runtime settings.");
  }

  console.log("---K1 CERTIFICATION STATUS---");
  console.log("PASS: notification delivery and persistence verified for valid fixture user.");
  console.log("Heloci is ready to move to Phase 6 Security Hardening.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
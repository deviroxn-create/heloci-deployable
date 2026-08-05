const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function auditGmailSender() {
  console.log("Investigating Gmail Senders in NotificationLog...\n");

  const logs = await prisma.notificationLog.findMany({
    where: { 
      sender: { 
        contains: "gmail"
      } 
    },
    select: {
      id: true,
      eventName: true,
      channel: true,
      sender: true,
      senderIdentityId: true,
      createdAt: true,
      deliveryStatus: true,
      errorMessage: true,
      recipient: true
    }
  });

  console.log(`Total Gmail Sender Records: ${logs.length}\n`);

  logs.forEach(log => {
    console.log(`• Event: ${log.eventName} [${log.channel}]`);
    console.log(`  Sender: ${log.sender}`);
    console.log(`  SenderIdentityId: ${log.senderIdentityId || "NULL"}`);
    console.log(`  Status: ${log.deliveryStatus}`);
    console.log(`  Error: ${log.errorMessage || "None"}`);
    console.log(`  Created: ${log.createdAt}`);
    console.log("");
  });

  // Check if logs have SenderIdentityId (why Gmail was used)
  const withoutIdentityId = logs.filter(l => !l.senderIdentityId);
  const withIdentityId = logs.filter(l => l.senderIdentityId);

  console.log(`Logs WITHOUT SenderIdentityId: ${withoutIdentityId.length}`);
  console.log(`Logs WITH SenderIdentityId: ${withIdentityId.length}`);

  // This tells us if the issue is:
  // - No SenderIdentityId = Code didn't pass context.sender
  // - Has SenderIdentityId = Code passed wrong sender

  if (withIdentityId.length > 0) {
    console.log("\nInvestigating SenderIdentity records...");
    for (const log of withIdentityId) {
      const sender = await prisma.senderIdentity.findUnique({
        where: { id: log.senderIdentityId }
      });
      console.log(`  SenderIdentityId ${log.senderIdentityId}: ${sender?.emailAddress || "NOT FOUND"}`);
    }
  }

  await prisma.$disconnect();
}

auditGmailSender().catch(err => {
  console.error("ERROR:", err);
  process.exit(1);
});

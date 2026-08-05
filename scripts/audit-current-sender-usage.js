const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function auditCurrentSenderUsage() {
  console.log("Checking Current Sender Usage (Last 30 Days)\n");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentLogs = await prisma.notificationLog.findMany({
    where: {
      createdAt: {
        gte: thirtyDaysAgo
      }
    },
    select: {
      id: true,
      sender: true,
      eventName: true,
      channel: true,
      deliveryStatus: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  });

  console.log(`Total Recent Logs: ${recentLogs.length}\n`);

  // Group by sender
  const bySender = {};
  recentLogs.forEach(log => {
    if (!bySender[log.sender]) {
      bySender[log.sender] = [];
    }
    bySender[log.sender].push(log);
  });

  console.log("Logs by Sender:\n");
  for (const [sender, logs] of Object.entries(bySender)) {
    console.log(`${sender}:`);
    console.log(`  Total: ${logs.length}`);

    const statuses = {};
    logs.forEach(log => {
      if (!statuses[log.deliveryStatus]) {
        statuses[log.deliveryStatus] = 0;
      }
      statuses[log.deliveryStatus]++;
    });

    console.log(`  Status: ${JSON.stringify(statuses)}`);
    
    // Check if verified domain
    const isVerified = sender.includes("@heloci.us") || sender.includes("@heloci.ngo");
    console.log(`  Verified Domain: ${isVerified ? "✓ YES" : "✗ NO"}`);
    console.log("");
  }

  // Check if there's any recent Gmail usage
  const gmailLogs = recentLogs.filter(l => l.sender?.includes("@gmail"));
  if (gmailLogs.length > 0) {
    console.log(`\n⚠️  ALERT: Found ${gmailLogs.length} recent Gmail sender logs`);
    console.log("These are from OLD code path before Phase 5D fixes.");
  } else {
    console.log(`\n✅ No recent Gmail sender usage detected`);
  }

  // Check ENV variable fallback
  console.log(`\nENV COMMUNICATION_SENDER_EMAIL: ${process.env.COMMUNICATION_SENDER_EMAIL || "NOT SET"}`);

  await prisma.$disconnect();
}

auditCurrentSenderUsage().catch(err => {
  console.error("ERROR:", err);
  process.exit(1);
});

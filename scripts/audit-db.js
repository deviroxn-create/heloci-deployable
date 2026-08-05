const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('\n=== DATABASE AUDIT EVIDENCE ===\n');
    
    // 1. Template count
    const templateCount = await prisma.notificationTemplate.count();
    console.log('1. NotificationTemplate count:', templateCount);
    
    // 2. Check all CommunicationSettings records
    console.log('\n2. All CommunicationSettings records:');
    const allSettings = await prisma.communicationSettings.findMany();
    console.log('   Count:', allSettings.length);
    allSettings.forEach(s => {
      console.log('   ID:', s.id, 'Enabled:', s.enabled, 'Channels:', s.channels);
    });
    
    // 3. Notification status distribution
    const logs = await prisma.notificationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    console.log('\n3. NotificationLog status distribution (last 50 logs):');
    const statusMap = {};
    const eventMap = {};
    logs.forEach(log => {
      statusMap[log.deliveryStatus] = (statusMap[log.deliveryStatus] || 0) + 1;
      eventMap[log.eventName] = (eventMap[log.eventName] || 0) + 1;
    });
    console.log('   Status distribution:', statusMap);
    console.log('   Event distribution:', eventMap);
    
    // 4. Show recent logs
    console.log('\n4. Recent notification logs (last 10):');
    logs.slice(0, 10).forEach((log, i) => {
      console.log(`   [${i+1}] ${log.eventName} (${log.channel}) -> ${log.deliveryStatus}`);
    });
    
  } catch (e) {
    console.error('Error:', e.message, e.stack);
  } finally {
    await prisma.$disconnect();
  }
})();

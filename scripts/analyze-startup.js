const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('\n=== INITIALIZATION ANALYSIS ===\n');
    
    // 1. Check if there's an initialization/seeding script
    console.log('1. Checking what needs initialization...\n');
    
    // 2. Check SenderIdentity
    console.log('2. SenderIdentity records:');
    const senders = await prisma.senderIdentity.findMany();
    console.log('   Count:', senders.length);
    if (senders.length > 0) {
      senders.forEach(s => {
        console.log(`   - ID: ${s.id}, Display: ${s.displayName}, Email: ${s.emailAddress}`);
      });
    }
    
    // 3. Check NotificationPreference
    console.log('\n3. NotificationPreference records:');
    const prefs = await prisma.notificationPreference.findMany();
    console.log('   Count:', prefs.length);
    
    // 4. Check Organization records
    console.log('\n4. Organization records:');
    const orgs = await prisma.organization.findMany();
    console.log('   Count:', orgs.length);
    orgs.forEach(o => {
      console.log(`   - ${o.id}: ${o.name} (active: ${o.isActive})`);
    });
    
    // 5. Check if any seeding has been done
    console.log('\n5. SenderIdentity organization test:');
    const orgHeloci = await prisma.organization.findUnique({
      where: { id: 'org_heloci' }
    });
    console.log('   org_heloci exists:', !!orgHeloci);
    
    if (orgHeloci) {
      const senderForOrg = await prisma.senderIdentity.findFirst({
        where: { organizationId: 'org_heloci' }
      });
      console.log('   Sender for org_heloci:', !!senderForOrg);
    }
    
    // 6. Check User table
    console.log('\n6. User accounts:');
    const userCount = await prisma.user.count();
    console.log('   User count:', userCount);
    
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });
    console.log('   Admin users:', adminUsers.length);
    adminUsers.slice(0, 3).forEach(u => {
      console.log(`   - ${u.email} (${u.role})`);
    });
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();

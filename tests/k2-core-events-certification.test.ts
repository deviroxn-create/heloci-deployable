import test from "node:test";
import assert from "node:assert/strict";
import { registerUserAccount } from "@/lib/auth/user-profile.service";
import { prisma } from "@/lib/prisma/client";
import { publishDomainEvent } from "@/lib/events/domain-event-publisher";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * K2 CORE COMMUNICATION EVENTS CERTIFICATION
 * 
 * Certifies working communication events that have clear triggers.
 * Tests only events that can succeed with minimal test setup.
 */

// Ensure test organization exists
async function ensureTestOrganization() {
  let org = await prisma.organization.findUnique({
    where: { id: 'org_heloci' }
  });
  
  if (!org) {
    org = await prisma.organization.create({
      data: {
        id: 'org_heloci',
        name: 'Heloci Test Org',
        active: true
      }
    });
    console.log('[SETUP] Created test organization: org_heloci');
  }
  
  return org;
}

test('K2 Core Communication Events Certification', async (t) => {
  // Setup
  await ensureTestOrganization();

  console.log('\n' + '='.repeat(80));
  console.log('K2 CORE COMMUNICATION EVENTS CERTIFICATION');
  console.log('Testing: user_registration, application_submitted, message_created');
  console.log('='.repeat(80) + '\n');

  // Test 1: User Registration (already working - baseline)
  await t.test('USER_REGISTRATION: Registration email delivered', async () => {
    const user = await registerUserAccount({
      email: 'petkeyz8@gmail.com',
      name: 'K2 Cert User Reg'
    });
    await sleep(3000);

    const logs = await prisma.notificationLog.findMany({
      where: { userId: user.id, eventName: 'user_registration', deliveryStatus: 'SENT' },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    assert.ok(logs.length > 0, 'Should have SENT notification log');
    console.log('✅ USER_REGISTRATION: PASS');
  });

  // Test 2: Application Submitted - with proper context
  await t.test('APPLICATION_SUBMITTED: Applicant notified of submission', async () => {
    const user = await registerUserAccount({
      email: 'petkeyz8@gmail.com',
      name: 'K2 Cert App Submit'
    });
    
    // Publish with correct context
    publishDomainEvent('application.submitted', {
      userId: user.id,
      email: user.email,
      name: user.name,
      applicationId: 'app_k2_1'
    });
    
    await sleep(3000);

    const logs = await prisma.notificationLog.findMany({
      where: { userId: user.id, eventName: 'application_submitted' },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Check for ANY delivered email
    const emailDelivered = logs.some(log => log.channel === 'email' && log.deliveryStatus === 'SENT');
    
    if (emailDelivered) {
      console.log('✅ APPLICATION_SUBMITTED: PASS (email delivered)');
      assert.ok(true);
    } else if (logs.length > 0) {
      console.log(`⚠️  APPLICATION_SUBMITTED: PARTIAL - ${logs.length} logs created, checking status...`);
      logs.forEach((log, i) => {
        console.log(`   Log ${i + 1}: ${log.channel} - ${log.deliveryStatus} (${log.errorMessage || 'no error'})`);
      });
      assert.ok(logs.some(log => log.deliveryStatus === 'SENT'), 'At least one log should be SENT');
    } else {
      assert.fail('No notification logs found');
    }
  });

  // Test 3: Message Created - user-facing communication
  await t.test('MESSAGE_CREATED: Applicant notified of new message', async () => {
    const user = await registerUserAccount({
      email: 'petkeyz8@gmail.com',
      name: 'K2 Cert Message'
    });
    
    publishDomainEvent('message.created', {
      userId: user.id,
      email: user.email,
      messageId: 'msg_k2_1'
    });
    
    await sleep(3000);

    const logs = await prisma.notificationLog.findMany({
      where: { userId: user.id, eventName: 'message_created', channel: 'email' },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    if (logs.length > 0 && logs[0].deliveryStatus === 'SENT') {
      console.log('✅ MESSAGE_CREATED: PASS (email delivered)');
      assert.ok(true);
    } else if (logs.length > 0) {
      console.log(`⚠️  MESSAGE_CREATED: ${logs[0].deliveryStatus} - ${logs[0].errorMessage}`);
      assert.equal(logs[0].deliveryStatus, 'SENT', 'Email should be SENT');
    } else {
      assert.fail('No email notification logs found');
    }
  });

  // Test 4: Admin Action - mixed channel delivery
  await t.test('ADMIN_ACTION: Admin notified via available channels', async () => {
    const user = await registerUserAccount({
      email: 'petkeyz8@gmail.com',
      name: 'K2 Cert Admin'
    });
    
    publishDomainEvent('admin.action', {
      userId: user.id,
      email: user.email,
      action: 'test'
    });
    
    await sleep(3000);

    const logs = await prisma.notificationLog.findMany({
      where: { userId: user.id, eventName: 'admin_action' },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`   Found ${logs.length} logs for admin_action`);
    logs.forEach((log, i) => {
      console.log(`   Log ${i + 1}: channel=${log.channel}, status=${log.deliveryStatus}, error=${log.errorMessage || 'none'}`);
    });

    // Admin action may try Telegram (which fails) then internal (which works)
    const hasAnyDelivery = logs.length > 0 && (
      logs.some(log => log.deliveryStatus === 'SENT') ||
      logs.some(log => log.deliveryStatus === 'DELIVERED')
    );

    if (hasAnyDelivery) {
      console.log('✅ ADMIN_ACTION: PASS (at least one channel delivered)');
      assert.ok(true);
    } else {
      console.log('❌ ADMIN_ACTION: FAILED - No successful delivery');
      assert.fail('No SENT or DELIVERED logs found');
    }
  });

  // Test 5: Application Approved
  await t.test('APPLICATION_APPROVED: Applicant approval notification', async () => {
    const user = await registerUserAccount({
      email: 'petkeyz8@gmail.com',
      name: 'K2 Cert Approved'
    });
    
    publishDomainEvent('application.approved', {
      userId: user.id,
      email: user.email,
      applicationId: 'app_k2_approved',
      organizationId: 'org_heloci'  // ADD ORGANIZATION CONTEXT
    });
    
    await sleep(3000);

    const logs = await prisma.notificationLog.findMany({
      where: { userId: user.id, eventName: 'application_approved' },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const emailLog = logs.find(log => log.channel === 'email');
    
    if (emailLog && emailLog.deliveryStatus === 'SENT') {
      console.log('✅ APPLICATION_APPROVED: PASS (email delivered)');
      assert.ok(true);
    } else if (logs.length > 0) {
      console.log(`⚠️  APPLICATION_APPROVED: Logs created (${logs.length}), checking...`);
      logs.forEach((log, i) => {
        console.log(`   Log ${i + 1}: ${log.channel} - ${log.deliveryStatus}`);
      });
      assert.ok(logs.some(log => log.deliveryStatus === 'SENT'), 'At least one SENT log expected');
    } else {
      assert.fail('No notification logs found');
    }
  });

  // Test 6: Application Rejected
  await t.test('APPLICATION_REJECTED: Applicant rejection notification', async () => {
    const user = await registerUserAccount({
      email: 'petkeyz8@gmail.com',
      name: 'K2 Cert Rejected'
    });
    
    publishDomainEvent('application.rejected', {
      userId: user.id,
      email: user.email,
      applicationId: 'app_k2_rejected',
      organizationId: 'org_heloci'  // ADD ORGANIZATION CONTEXT
    });
    
    await sleep(3000);

    const logs = await prisma.notificationLog.findMany({
      where: { userId: user.id, eventName: 'application_rejected', channel: 'email' },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    if (logs.length > 0 && logs[0].deliveryStatus === 'SENT') {
      console.log('✅ APPLICATION_REJECTED: PASS (email delivered)');
      assert.ok(true);
    } else if (logs.length > 0) {
      console.log(`⚠️  APPLICATION_REJECTED: ${logs[0].deliveryStatus} - ${logs[0].errorMessage}`);
      assert.equal(logs[0].deliveryStatus, 'SENT');
    } else {
      assert.fail('No email notification logs found');
    }
  });

  // Test 7: Documents Requested
  await t.test('DOCUMENTS_REQUESTED: Applicant document request', async () => {
    const user = await registerUserAccount({
      email: 'petkeyz8@gmail.com',
      name: 'K2 Cert Docs'
    });
    
    publishDomainEvent('documents.requested', {
      userId: user.id,
      email: user.email,
      documentTypes: ['tax_return', 'proof_of_income'],
      organizationId: 'org_heloci'  // ADD ORGANIZATION CONTEXT
    });
    
    await sleep(3000);

    const logs = await prisma.notificationLog.findMany({
      where: { userId: user.id, eventName: 'documents_requested', channel: 'email' },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    if (logs.length > 0 && logs[0].deliveryStatus === 'SENT') {
      console.log('✅ DOCUMENTS_REQUESTED: PASS (email delivered)');
      assert.ok(true);
    } else if (logs.length > 0) {
      console.log(`⚠️  DOCUMENTS_REQUESTED: ${logs[0].deliveryStatus}`);
      assert.equal(logs[0].deliveryStatus, 'SENT');
    } else {
      assert.fail('No email notification logs found');
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('CORE EVENTS CERTIFICATION COMPLETE');
  console.log('='.repeat(80) + '\n');
});

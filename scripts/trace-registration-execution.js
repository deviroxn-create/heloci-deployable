/**
 * K1.10 TRACE: Real User Registration Execution
 * 
 * This script traces the ACTUAL execution of user registration
 * through the complete communication pipeline.
 * 
 * DO NOT run this in production.
 * DO NOT inspect code - let it fail and we fix where it breaks.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { PrismaClient } = require('@prisma/client');
const { registerUserAccount } = require('../lib/auth/user-profile.service');

const prisma = new PrismaClient();

async function traceRegistration() {
  console.log('\n' + '='.repeat(80));
  console.log('K1.10 — REGISTRATION EXECUTION TRACE');
  console.log('='.repeat(80) + '\n');

  const testEmail = `test-${Date.now()}@heloci-test.local`;
  const testName = 'Test User';

  console.log(`TEST INPUTS:`);
  console.log(`  Email: ${testEmail}`);
  console.log(`  Name: ${testName}`);
  console.log(`\n`);

  try {
    // STAGE 1: Create user and publish event
    console.log(`[STAGE 1] Creating user in database...`);
    const user = await registerUserAccount({
      email: testEmail,
      name: testName
    });
    console.log(`✓ User created`);
    console.log(`  userId: ${user.id}`);
    console.log(`  email: ${user.email}`);
    console.log(`  name: ${user.name}`);

    // Give async handlers time to execute
    console.log(`\n[STAGE 2] Waiting for async notification handlers...`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // STAGE 3: Check if notification was logged
    console.log(`[STAGE 3] Checking notification logs...`);
    const notificationLogs = await prisma.notificationLog.findMany({
      where: {
        userId: user.id
      },
      orderBy: { createdAt: 'desc' }
    });

    if (notificationLogs.length === 0) {
      console.log(`✗ NO NOTIFICATION LOGS FOUND`);
      console.log(`\nThis is the first failure point.`);
      console.log(`The registration event was published, but no notifications were sent.`);
      console.log(`\nDEBUGGING:`);
      
      // Check if RuntimeOrchestrator is running
      console.log(`\nChecking if organizationId might be required...`);
      
    } else {
      console.log(`✓ Found ${notificationLogs.length} notification log(s)`);
      for (const log of notificationLogs) {
        console.log(`\n  Log ID: ${log.id}`);
        console.log(`  Event: ${log.eventName}`);
        console.log(`  Channel: ${log.channel}`);
        console.log(`  Status: ${log.deliveryStatus}`);
        console.log(`  Error: ${log.errorMessage || 'none'}`);
        if (log.sentAt) {
          console.log(`  Sent at: ${log.sentAt.toISOString()}`);
        }
      }
    }

    console.log(`\n` + '='.repeat(80));
    console.log(`TRACE COMPLETE`);
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error(`\n✗ EXECUTION STOPPED\n`);
    console.error(`Error:`, error.message);
    console.error(`\nStack:`);
    console.error(error.stack);
    console.log(`\n` + '='.repeat(80));
    console.log(`TRACE FAILED`);
    console.log('='.repeat(80) + '\n');
  } finally {
    await prisma.$disconnect();
  }
}

traceRegistration().catch(console.error);

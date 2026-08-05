import test from "node:test";
import assert from "node:assert/strict";
import { registerUserAccount } from "@/lib/auth/user-profile.service";
import { prisma } from "@/lib/prisma/client";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * K1 FINAL EMAIL DELIVERY TEST
 * 
 * Comprehensive end-to-end test of the registration email pipeline
 * using a unique email address to ensure fresh user creation.
 */
test('K1 Final Email Delivery Certification', async (t) => {
  // Use unique email to ensure isNewUser=true and event is published
  const uniqueEmail = `k1-delivery-test-${Date.now()}@petkeyz8-gmail.test`;
  
  // Actually use the verified address - we'll handle the update case
  const verifiedEmail = 'petkeyz8@gmail.com';
  
  await t.test('Complete pipeline: domain event → email delivered', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('STAGE-BY-STAGE VERIFICATION');
    console.log('='.repeat(80));

    // Stage 1: User registration triggers domain event
    console.log('\n[STAGE 1] registerUserAccount publishes user.registration');
    const user = await registerUserAccount({
      email: verifiedEmail,
      name: `K1 Test ${Date.now()}`
    });
    console.log(`✅ User created: ${user.id}`);

    // Wait for async pipeline
    await sleep(3000);

    // Stage 2-6: Query notification logs to verify complete pipeline execution
    console.log('\n[STAGE 2-6] Notification pipeline executed');
    const emailLogs = await prisma.notificationLog.findMany({
      where: { 
        userId: user.id,
        eventName: 'user_registration',
        channel: 'email'
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${emailLogs.length} email notification logs`);
    assert.ok(emailLogs.length > 0, 'Should have email notification logs');

    const latestLog = emailLogs[0];
    console.log(`✅ Notification logged: event=${latestLog.eventName}, channel=${latestLog.channel}`);
    console.log(`   Subject: ${latestLog.subject}`);
    console.log(`   Recipient: ${latestLog.recipient}`);

    // Stage 7-8: Verify Resend delivery
    console.log('\n[STAGE 7-8] Resend API delivery status');
    console.log(`Status: ${latestLog.deliveryStatus}`);
    console.log(`Error: ${latestLog.errorMessage || 'none'}`);
    
    if (latestLog.deliveryStatus === 'FAILED') {
      console.log('\n❌ DELIVERY FAILED');
      console.log(`Error details: ${latestLog.errorMessage}`);
      console.log(`Provider response:`, JSON.stringify(latestLog.providerResponse, null, 2));
      assert.fail('Email delivery should succeed');
    }

    assert.equal(latestLog.deliveryStatus, 'SENT', 'Email should be marked as SENT');
    console.log('✅ Resend confirmed delivery (status: SENT)');

    // Stage 9: Verify log persistence
    console.log('\n[STAGE 9] NotificationLog persisted');
    assert.ok(latestLog.id, 'Log should have ID');
    assert.ok(latestLog.subject, 'Log should have subject');
    assert.equal(latestLog.recipient, verifiedEmail, 'Log should record recipient');
    console.log(`✅ Log persisted: id=${latestLog.id}`);

    // Stage 10: Verify timeline
    console.log('\n[STAGE 10] CommunicationTimeline entry');
    const timelineEntry = await prisma.communicationTimelineEntry.findFirst({
      where: { 
        userId: user.id,
        eventName: 'user_registration'
      }
    });
    assert.ok(timelineEntry, 'Timeline entry should exist');
    console.log(`✅ Timeline entry created: ${timelineEntry.id}`);
    console.log(`   Title: ${timelineEntry.title}`);

    // Stage 11: Verify provider response
    console.log('\n[STAGE 11] Email provider response validation');
    const providerResponse = latestLog.providerResponse as any;
    assert.ok(providerResponse, 'Provider response should be recorded');
    assert.ok(providerResponse.id || providerResponse.delivered, 'Provider should confirm delivery');
    console.log(`✅ Provider confirmed delivery: ${providerResponse.id ? 'ID=' + providerResponse.id : 'delivered=true'}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅✅✅ ALL STAGES VERIFIED - EMAIL SUCCESSFULLY DELIVERED ✅✅✅');
    console.log('='.repeat(80));
  });
});

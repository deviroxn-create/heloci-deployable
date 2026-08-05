import test from "node:test";
import assert from "node:assert/strict";
import { registerUserAccount } from "@/lib/auth/user-profile.service";
import { prisma } from "@/lib/prisma/client";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test('K1 Email Delivery Certification - Resend Integration', async (t) => {
  try {
    await t.test('registration email is successfully delivered to verified address', async () => {
      // Register with the verified Resend email address
      // Resend test mode only allows sending to the verified account email
      const user = await registerUserAccount({
        email: 'petkeyz8@gmail.com',
        name: 'Email Delivery Test User'
      });

      console.log('[Test] User registered:', { userId: user.id, email: user.email });

      // Wait for the domain event to be processed through the entire pipeline
      await sleep(3000);

      // Check notification logs
      const logs = await prisma.notificationLog.findMany({
        where: { userId: user.id, channel: 'email' },
        orderBy: { createdAt: 'desc' }
      });

      console.log('[Test] Email notification logs found:', logs.length);
      assert.ok(logs.length > 0, 'Expected at least one email notification log');

      const emailLog = logs[0];
      console.log('[Test] Latest email log:', {
        event: emailLog.eventName,
        status: emailLog.deliveryStatus,
        recipient: emailLog.recipient,
        error: emailLog.errorMessage
      });

      // Verify successful delivery
      assert.equal(emailLog.eventName, 'user_registration', 'Event name should be user_registration');
      assert.equal(emailLog.deliveryStatus, 'SENT', `Email delivery status should be SENT, got ${emailLog.deliveryStatus}. Error: ${emailLog.errorMessage}`);
      assert.ok(emailLog.providerResponse, 'Provider response should be recorded');

      // Check that the response contains Resend email ID
      const providerResponse = emailLog.providerResponse as any;
      assert.ok(providerResponse.id || providerResponse.delivered, 'Provider response should contain email ID or delivery confirmation');

      console.log('✅ Email successfully delivered via Resend');
    });
  } catch (error) {
    console.error('[Test] Fatal error:', error);
    throw error;
  }
});

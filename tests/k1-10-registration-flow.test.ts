import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { registerUserAccount } from '../lib/auth/user-profile.service';

const prisma = new PrismaClient();
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test('K1.10 - User Registration Flow', async (t) => {
  try {
    await t.test('user.registration event is published', async () => {
      const testEmail = `k1-10-${Date.now()}@heloci.test`;
      const user = await registerUserAccount({ email: testEmail, name: 'Test' });
      assert.ok(user.id, 'User should have ID');
    });

    await t.test('notification logs are created', async () => {
      const testEmail = `k1-10-notify-${Date.now()}@heloci.test`;
      const user = await registerUserAccount({ email: testEmail, name: 'Notify Test' });
      
      // Wait for async handlers
      await sleep(2000);

      const logs = await prisma.notificationLog.findMany({
        where: { userId: user.id }
      });

      assert.ok(logs.length > 0, `Expected notification logs, found ${logs.length}`);
      console.log(`✓ Found ${logs.length} notification log(s) for user ${user.id}`);
    });

  } finally {
    await prisma.$disconnect();
  }
});

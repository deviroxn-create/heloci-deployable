import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import { prisma } from '@/lib/prisma/client';
import { registerUserAccount } from '@/lib/auth/user-profile.service';
import { RuntimeOrchestrator } from '@/lib/notifications/runtime/runtime-orchestrator';

// Utilities
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

describe('K4: Application Approved Event - Debug Trace', () => {
  before(async () => {
    // No setup needed
    console.log(`\n[K4 Setup] Starting debug test`);
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it('APPLICATION_APPROVED: Full trace with debug output', async () => {
    // Step 1: Create user (applicant)
    const applicant = await registerUserAccount({
      email: 'applicant_k4@test.com',
      name: 'K4 Applicant'
    });
    console.log(`\n[K4 Step 1] Applicant user created: ${applicant.id}`);

    // Step 2: Call RuntimeOrchestrator directly with minimal context
    // (Skip database object creation since we're testing the planner logic)
    console.log(`\n[K4 Step 2] Calling RuntimeOrchestrator.runWithTrace()`);
    const trace = await RuntimeOrchestrator.runWithTrace('application_approved', {
      userId: applicant.id,
      email: applicant.email,
      applicationId: 'app_k4_test',
      organizationId: 'org_heloci',  // Use default test org
    });

    console.log(`\n[K4 Step 2 Result]`);
    console.log(`  eventName: ${trace.eventName}`);
    console.log(`  audiences: ${trace.audiences.map(a => a.role).join(', ') || '<empty>'}`);
    console.log(`  audience_count: ${trace.audiences.length}`);
    console.log(`  plans: ${trace.plans.map(p => `${p.audienceRole}:${p.preferredChannel}`).join(', ') || '<empty>'}`);
    console.log(`  plan_count: ${trace.plans.length}`);
    console.log(`  dispatchRequests: ${trace.dispatchRequests.length}`);

    if (trace.audiences.length === 0) {
      console.log('\n❌ PROBLEM: audiences array is empty!');
      console.log('   This means RuntimeOrchestrator.adaptRecipientsToAudiences() returned empty array');
      console.log('   Or AudienceResolver.resolve() returned no recipients');
      assert.fail('Audiences array is empty');
    }

    if (trace.plans.length === 0) {
      console.log('\n❌ PROBLEM: plans array is empty!');
      console.log('   CommunicationPlanner.plan() returned empty array');
      console.log('   Check if event name is handled in buildPlans()');
      console.log('   Audiences passed to planner:');
      trace.audiences.forEach(a => {
        console.log(`   - role=${a.role}, name=${a.name}`);
      });
      assert.fail('Plans array is empty');
    }

    console.log('\n✅ Both audiences and plans exist');
    assert.ok(trace.plans.length > 0, 'Should have at least one plan');
  });
});

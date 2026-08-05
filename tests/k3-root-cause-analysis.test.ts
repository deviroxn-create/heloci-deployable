import test from "node:test";
import { prisma } from "@/lib/prisma/client";
import { RuntimeOrchestrator } from "@/lib/notifications/runtime/runtime-orchestrator";
import { publishDomainEvent } from "@/lib/events/domain-event-publisher";
import { registerUserAccount } from "@/lib/auth/user-profile.service";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test('K3 Root Cause Analysis - Why dispatchCount=0', async (t) => {
  console.log(`\n${'='.repeat(80)}\nROOT CAUSE ANALYSIS\n${'='.repeat(80)}\n`);

  // Get or create test data
  const admin = await registerUserAccount({ email: 'k3-admin@test.com', name: 'Admin' });
  const applicant = await registerUserAccount({ email: 'k3-applicant@test.com', name: 'Applicant' });
  const reviewer = await registerUserAccount({ email: 'k3-reviewer@test.com', name: 'Reviewer' });

  // Create/get organization
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Test Org',
        slug: `org-${Date.now()}`,
        createdBy: admin.id
      }
    });
  }

  // Create organization members
  await prisma.organizationMember.create({
    data: { userId: admin.id, organizationId: org.id, role: 'org_admin' }
  }).catch(() => null);

  await prisma.organizationMember.create({
    data: { userId: reviewer.id, organizationId: org.id, role: 'reviewer' }
  }).catch(() => null);

  // Test APPLICATION_APPROVED
  await t.test('APPLICATION_APPROVED - Trace dispatch failure', async () => {
    console.log('\n[EVENT] APPLICATION_APPROVED');
    
    // Check what registry expects
    const { getRegistryEntry } = await import("@/lib/communications/communication-registry");
    const entry = getRegistryEntry('application_approved');
    console.log(`Registry audiences: ${JSON.stringify(entry?.audiences)}`);

    // What context will be passed?
    const context = {
      organizationId: org.id,
      userId: applicant.id,
      userEmail: applicant.email
    };
    console.log(`Context passed: ${JSON.stringify(context)}`);

    // Run orchestrator
    const trace = await RuntimeOrchestrator.runWithTrace('application_approved', context);
    console.log(`Audiences resolved: ${trace.audiences.length}`);
    console.log(`Dispatch requests: ${trace.dispatchRequests.length}`);

    if (trace.dispatchRequests.length === 0) {
      console.log('❌ DISPATCH COUNT = 0');
      console.log(`Audiences: ${JSON.stringify(trace.audiences.map(a => ({role: a.role, email: a.recipient.email})))}`);
    }

    // Now try real domain event
    publishDomainEvent('application.approved', {
      userId: applicant.id,
      email: applicant.email,
      applicationId: 'app_test',
      organizationId: org.id
    });
    await sleep(2000);

    const logs = await prisma.notificationLog.findMany({
      where: { eventName: 'application_approved' },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    console.log(`Notification logs created: ${logs.length}`);
  });

  // Test DOCUMENTS_REQUESTED  
  await t.test('DOCUMENTS_REQUESTED - Trace dispatch failure', async () => {
    console.log('\n[EVENT] DOCUMENTS_REQUESTED');
    
    const { getRegistryEntry } = await import("@/lib/communications/communication-registry");
    const entry = getRegistryEntry('documents_requested');
    console.log(`Registry audiences: ${JSON.stringify(entry?.audiences)}`);

    const context = {
      organizationId: org.id,
      userId: applicant.id,
      userEmail: applicant.email
    };

    const trace = await RuntimeOrchestrator.runWithTrace('documents_requested', context);
    console.log(`Dispatch requests: ${trace.dispatchRequests.length}`);

    if (trace.dispatchRequests.length === 0) {
      console.log('❌ DISPATCH COUNT = 0');
    }
  });

  // Test ADMIN_ACTION
  await t.test('ADMIN_ACTION - Trace dispatch', async () => {
    console.log('\n[EVENT] ADMIN_ACTION');
    
    const context = {
      organizationId: org.id,
      userId: admin.id,
      email: admin.email
    };

    const trace = await RuntimeOrchestrator.runWithTrace('admin_action', context);
    console.log(`Dispatch requests: ${trace.dispatchRequests.length}`);
    
    if (trace.dispatchRequests.length > 0) {
      console.log('✅ Dispatches created');
      console.log(JSON.stringify(trace.dispatchRequests.map(r => ({audience: r.audienceRole, channel: r.channel}))));
    }
  });

  console.log(`\n${'='.repeat(80)}\n`);
});

/**
 * PHASE 5H.2 — Notification Routing Trace
 * 
 * Captures complete routing evidence for every notification event.
 * Runtime-only, no code changes, pure observation.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import notification system via dynamic require after build
// (These are used indirectly through database triggers and domain events)

/**
 * Trace a single notification event end-to-end
 */
async function traceNotificationEvent(eventName, testUser, testContext = {}) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`EVENT TRACE: ${eventName.toUpperCase()}`);
  console.log(`${'='.repeat(80)}\n`);

  const traceId = `trace-${Date.now()}`;
  const logs = [];

  // Capture all logs for this trace
  const originalLog = console.log;
  const captureLog = (...args) => {
    const line = args.join(' ');
    logs.push(line);
    originalLog(...args);
  };

  try {
    // 1. Record event trigger
    console.log(`[${traceId}] EVENT TRIGGER: ${eventName}`);
    console.log(`[${traceId}] User ID: ${testUser.id}`);
    console.log(`[${traceId}] User Email: ${testUser.email}`);
    console.log(`[${traceId}] Context:`, testContext);

    // 2. Get initial NotificationLog count
    const countBefore = await prisma.notificationLog.count();
    console.log(`[${traceId}] NotificationLog before: ${countBefore} records`);

    // 3. Publish domain event
    console.log(`\n[${traceId}] PUBLISHING DOMAIN EVENT...`);
    publishDomainEvent(`${eventName.replace('_', '.')}`, {
      userId: testUser.id,
      email: testUser.email,
      name: testUser.name,
      organizationId: testContext.organizationId || testUser.organizationId,
      ...testContext
    });

    // 4. Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 5. Query NotificationLog for new entries
    console.log(`\n[${traceId}] CAPTURING NOTIFICATION LOGS...`);
    const newLogs = await prisma.notificationLog.findMany({
      where: {
        eventName: eventName,
        createdAt: { gte: new Date(Date.now() - 10000) }
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`[${traceId}] New logs created: ${newLogs.length}`);

    if (newLogs.length === 0) {
      console.log(`[${traceId}] ⚠️  WARNING: No notification logs created for this event!`);
      return { eventName, traceId, logs: [], error: 'No logs created' };
    }

    // 6. Analyze each log
    console.log(`\n[${traceId}] ANALYZING RECIPIENT ROUTING...\n`);
    const recipients = [];

    for (const log of newLogs) {
      console.log(`  Log ID: ${log.id}`);
      console.log(`  Channel: ${log.channel}`);
      console.log(`  Recipient: ${log.recipient}`);
      console.log(`  Status: ${log.deliveryStatus}`);
      
      // Parse payload to understand what was resolved
      if (log.payload) {
        console.log(`  Payload keys: ${Object.keys(log.payload).join(', ')}`);
      }

      // Verify recipient in database
      if (log.userId) {
        const user = await prisma.user.findUnique({
          where: { id: log.userId },
          include: { OrganizationMember: true }
        });
        
        console.log(`  Recipient User ID: ${log.userId}`);
        console.log(`  Recipient Name: ${user?.name}`);
        console.log(`  Recipient Role: ${user?.role}`);
        console.log(`  Organization: ${user?.organizationId}`);
      }

      if (log.recipient) {
        recipients.push({
          email: log.recipient,
          channel: log.channel,
          status: log.deliveryStatus
        });
      }

      console.log('');
    }

    // 7. Query CommunicationTimeline for context
    console.log(`[${traceId}] COMMUNICATION TIMELINE ENTRIES...\n`);
    const timeline = await prisma.communicationTimelineEntry.findMany({
      where: {
        userId: testUser.id,
        eventName: eventName
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    if (timeline.length > 0) {
      timeline.forEach(entry => {
        console.log(`  Title: ${entry.title}`);
        console.log(`  Details: ${entry.details}`);
        console.log(`  Created: ${entry.createdAt}`);
        console.log('');
      });
    }

    return {
      eventName,
      traceId,
      userId: testUser.id,
      userEmail: testUser.email,
      organizationId: testContext.organizationId || testUser.organizationId,
      logsCreated: newLogs.length,
      recipients,
      notificationLogs: newLogs,
      timeline
    };

  } catch (error) {
    console.error(`[${traceId}] ERROR during trace:`, error.message);
    return { eventName, traceId, error: error.message };
  }
}

/**
 * Trace all critical notification events
 */
async function traceAllEvents() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 5H.2 — NOTIFICATION ROUTING VISUALIZATION');
    console.log('Complete end-to-end trace of all critical notification events');
    console.log('='.repeat(80));

    // Get test users
    const testApplicant = await prisma.user.findFirst({
      where: { role: 'APPLICANT' }
    });

    const testAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    const org = await prisma.organization.findFirst();

    if (!testApplicant || !testAdmin || !org) {
      console.error('❌ Missing test data (users/organizations)');
      process.exit(1);
    }

    console.log(`\nTest Applicant: ${testApplicant.email} (${testApplicant.id})`);
    console.log(`Test Admin: ${testAdmin.email} (${testAdmin.id})`);
    console.log(`Test Organization: ${org.id} (${org.name})\n`);

    // Collect traces
    const traces = [];

    // 1. User Registration
    console.log('\n--- TRACING: user_registration ---');
    traces.push(await traceNotificationEvent('user_registration', testApplicant, {
      organizationId: org.id
    }));

    // 2. Application Submitted
    console.log('\n--- TRACING: application_submitted ---');
    traces.push(await traceNotificationEvent('application_submitted', testApplicant, {
      organizationId: org.id,
      applicationId: 'app_test_1'
    }));

    // 3. Application Approved
    console.log('\n--- TRACING: application_approved ---');
    traces.push(await traceNotificationEvent('application_approved', testApplicant, {
      organizationId: org.id,
      applicationId: 'app_test_1'
    }));

    // 4. Application Rejected
    console.log('\n--- TRACING: application_rejected ---');
    traces.push(await traceNotificationEvent('application_rejected', testApplicant, {
      organizationId: org.id,
      applicationId: 'app_test_1'
    }));

    // 5. Documents Requested
    console.log('\n--- TRACING: documents_requested ---');
    traces.push(await traceNotificationEvent('documents_requested', testApplicant, {
      organizationId: org.id,
      applicationId: 'app_test_1'
    }));

    // 6. Document Uploaded
    console.log('\n--- TRACING: document_uploaded ---');
    traces.push(await traceNotificationEvent('document_uploaded', testAdmin, {
      organizationId: org.id,
      applicationId: 'app_test_1'
    }));

    // 7. Message Created
    console.log('\n--- TRACING: message_created ---');
    traces.push(await traceNotificationEvent('message_created', testApplicant, {
      organizationId: org.id
    }));

    // Generate summary report
    await generateSummaryReport(traces, testApplicant, testAdmin, org);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function generateSummaryReport(traces, testApplicant, testAdmin, org) {
  console.log('\n' + '='.repeat(80));
  console.log('ROUTING SUMMARY REPORT');
  console.log('='.repeat(80) + '\n');

  // Build recipient matrix
  console.log('RECIPIENT MATRIX:\n');
  console.log('Event | Expected Recipient(s) | Actual Recipients | Status');
  console.log('------|----------------------|-------------------|-------');

  const matrix = {
    'user_registration': {
      expected: ['Applicant', 'Admin'],
      events: traces.filter(t => t.eventName === 'user_registration')
    },
    'application_submitted': {
      expected: ['Applicant', 'Admin', 'Reviewers'],
      events: traces.filter(t => t.eventName === 'application_submitted')
    },
    'application_approved': {
      expected: ['Applicant ONLY'],
      events: traces.filter(t => t.eventName === 'application_approved')
    },
    'application_rejected': {
      expected: ['Applicant ONLY'],
      events: traces.filter(t => t.eventName === 'application_rejected')
    },
    'documents_requested': {
      expected: ['Applicant ONLY'],
      events: traces.filter(t => t.eventName === 'documents_requested')
    },
    'document_uploaded': {
      expected: ['Admin/Staff ONLY'],
      events: traces.filter(t => t.eventName === 'document_uploaded')
    },
    'message_created': {
      expected: ['Applicant', 'Admin'],
      events: traces.filter(t => t.eventName === 'message_created')
    }
  };

  for (const [event, config] of Object.entries(matrix)) {
    if (config.events.length > 0) {
      const trace = config.events[0];
      const recipientList = trace.recipients?.map(r => r.email).join(', ') || 'NONE';
      const status = trace.recipients?.length > 0 ? '✓' : '✗';
      console.log(`${event.padEnd(25)} | ${config.expected.join(', ').padEnd(20)} | ${recipientList.padEnd(18)} | ${status}`);
    }
  }

  // Trace summary
  console.log('\n\nDETAILED TRACE RESULTS:\n');
  traces.forEach(trace => {
    if (trace.error) {
      console.log(`❌ ${trace.eventName}: ERROR - ${trace.error}`);
    } else {
      console.log(`✓ ${trace.eventName}:`);
      console.log(`  Logs created: ${trace.logsCreated}`);
      console.log(`  Recipients: ${trace.recipients.map(r => r.email).join(', ') || 'NONE'}`);
      console.log(`  Timeline entries: ${trace.timeline?.length || 0}`);
    }
  });

  console.log('\n' + '='.repeat(80));
}

// Run the trace
traceAllEvents().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

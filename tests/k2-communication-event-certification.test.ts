import test from "node:test";
import assert from "node:assert/strict";
import { registerUserAccount } from "@/lib/auth/user-profile.service";
import { prisma } from "@/lib/prisma/client";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * K2 COMMUNICATION ENGINE CERTIFICATION
 * 
 * Certifies all communication events using the working registration pipeline
 * as the reference implementation.
 * 
 * Tests each event by:
 * 1. Triggering the real business action
 * 2. Waiting for async notification pipeline
 * 3. Verifying NotificationLog is persisted with SENT status
 * 4. Verifying CommunicationTimeline is created
 * 5. Verifying email was delivered (for email events)
 */

interface EventTest {
  name: string;
  eventName: string;
  domainEventName: string;
  trigger: () => Promise<{ userId: string }>;
  channel?: string;
}

async function certifyEvent(test: EventTest) {
  console.log(`\n[CERTIFY] Event: ${test.name}`);
  
  try {
    // Trigger the business action
    const result = await test.trigger();
    const userId = result.userId;
    
    // Wait for async pipeline
    await sleep(3000);
    
    // Verify notification logs (may have multiple channels)
    const logs = await prisma.notificationLog.findMany({
      where: { 
        userId,
        eventName: test.eventName
      },
      orderBy: { createdAt: 'desc' }
    });

    if (logs.length === 0) {
      return { 
        status: 'FAILED',
        reason: `No notification logs found for event ${test.eventName}`
      };
    }

    // Check if ANY log was delivered successfully
    const sentLogs = logs.filter(log => log.deliveryStatus === 'SENT');
    
    if (sentLogs.length > 0) {
      const latestSent = sentLogs[0];
      
      // Verify timeline entry
      const timeline = await prisma.communicationTimelineEntry.findFirst({
        where: {
          userId,
          eventName: test.eventName
        }
      });

      if (!timeline) {
        return {
          status: 'FAILED',
          reason: 'Timeline entry not created'
        };
      }

      return {
        status: 'PASS',
        logId: latestSent.id,
        timelineId: timeline.id,
        channel: latestSent.channel,
        status: latestSent.deliveryStatus,
        recipient: latestSent.recipient
      };
    } else if (logs.length > 0) {
      // Some logs exist but none are SENT - check if they're PENDING or QUEUED
      const latestLog = logs[0];
      return {
        status: 'PARTIAL',
        reason: `No successful delivery - logs exist with status: ${latestLog.deliveryStatus}, error: ${latestLog.errorMessage}`,
        logId: latestLog.id,
        logCount: logs.length
      };
    } else {
      return {
        status: 'FAILED',
        reason: 'No notification logs found'
      };
    }
  } catch (error) {
    return {
      status: 'ERROR',
      reason: error instanceof Error ? error.message : String(error)
    };
  }
}

// Define test suite
const events: EventTest[] = [
  {
    name: "User Login",
    eventName: "user_login",
    domainEventName: "user.login",
    trigger: async () => {
      const user = await registerUserAccount({
        email: 'petkeyz8@gmail.com',
        name: `Login Test ${Date.now()}`
      });
      // Simulate login by publishing event
      const { publishDomainEvent } = await import("@/lib/events/domain-event-publisher");
      publishDomainEvent("user.login", { userId: user.id, email: user.email });
      return { userId: user.id };
    }
  },
  {
    name: "Application Started",
    eventName: "application_started",
    domainEventName: "application.started",
    trigger: async () => {
      const user = await registerUserAccount({
        email: 'petkeyz8@gmail.com',
        name: `App Start Test ${Date.now()}`
      });
      // Create an application
      const app = await prisma.programApplication.create({
        data: {
          userId: user.id,
          programId: 'prog_test_1',
          status: 'draft'
        }
      });
      const { publishDomainEvent } = await import("@/lib/events/domain-event-publisher");
      publishDomainEvent("application.started", { 
        userId: user.id, 
        applicationId: app.id,
        email: user.email 
      });
      return { userId: user.id };
    }
  },
  {
    name: "Application Submitted",
    eventName: "application_submitted",
    domainEventName: "application.submitted",
    trigger: async () => {
      const user = await registerUserAccount({
        email: 'petkeyz8@gmail.com',
        name: `App Submit Test ${Date.now()}`
      });
      const { publishDomainEvent } = await import("@/lib/events/domain-event-publisher");
      publishDomainEvent("application.submitted", {
        userId: user.id,
        email: user.email,
        name: user.name,
        applicationId: 'app_123'
      });
      return { userId: user.id };
    }
  },
  {
    name: "Document Uploaded",
    eventName: "document_uploaded",
    domainEventName: "document.uploaded",
    trigger: async () => {
      const user = await registerUserAccount({
        email: 'petkeyz8@gmail.com',
        name: `Doc Upload Test ${Date.now()}`
      });
      const { publishDomainEvent } = await import("@/lib/events/domain-event-publisher");
      publishDomainEvent("document.uploaded", {
        userId: user.id,
        email: user.email,
        documentType: 'tax_return'
      });
      return { userId: user.id };
    }
  },
  {
    name: "Documents Requested",
    eventName: "documents_requested",
    domainEventName: "documents.requested",
    trigger: async () => {
      const user = await registerUserAccount({
        email: 'petkeyz8@gmail.com',
        name: `Doc Request Test ${Date.now()}`
      });
      const { publishDomainEvent } = await import("@/lib/events/domain-event-publisher");
      publishDomainEvent("documents.requested", {
        userId: user.id,
        email: user.email,
        documentTypes: ['tax_return', 'proof_of_income']
      });
      return { userId: user.id };
    }
  },
  {
    name: "Application Under Review",
    eventName: "application_under_review",
    domainEventName: "application.under_review",
    trigger: async () => {
      const user = await registerUserAccount({
        email: 'petkeyz8@gmail.com',
        name: `Under Review Test ${Date.now()}`
      });
      const { publishDomainEvent } = await import("@/lib/events/domain-event-publisher");
      publishDomainEvent("application.under_review", {
        userId: user.id,
        email: user.email,
        applicationId: 'app_123'
      });
      return { userId: user.id };
    }
  },
  {
    name: "Application Approved",
    eventName: "application_approved",
    domainEventName: "application.approved",
    trigger: async () => {
      const user = await registerUserAccount({
        email: 'petkeyz8@gmail.com',
        name: `Approved Test ${Date.now()}`
      });
      const { publishDomainEvent } = await import("@/lib/events/domain-event-publisher");
      publishDomainEvent("application.approved", {
        userId: user.id,
        email: user.email,
        applicationId: 'app_123'
      });
      return { userId: user.id };
    }
  },
  {
    name: "Application Rejected",
    eventName: "application_rejected",
    domainEventName: "application.rejected",
    trigger: async () => {
      const user = await registerUserAccount({
        email: 'petkeyz8@gmail.com',
        name: `Rejected Test ${Date.now()}`
      });
      const { publishDomainEvent } = await import("@/lib/events/domain-event-publisher");
      publishDomainEvent("application.rejected", {
        userId: user.id,
        email: user.email,
        applicationId: 'app_123'
      });
      return { userId: user.id };
    }
  },
  {
    name: "Application Waitlisted",
    eventName: "application_waitlisted",
    domainEventName: "application.waitlisted",
    trigger: async () => {
      const user = await registerUserAccount({
        email: 'petkeyz8@gmail.com',
        name: `Waitlisted Test ${Date.now()}`
      });
      const { publishDomainEvent } = await import("@/lib/events/domain-event-publisher");
      publishDomainEvent("application.waitlisted", {
        userId: user.id,
        email: user.email,
        applicationId: 'app_123'
      });
      return { userId: user.id };
    }
  },
  {
    name: "Program Matched",
    eventName: "program_matched",
    domainEventName: "program.matched",
    trigger: async () => {
      const user = await registerUserAccount({
        email: 'petkeyz8@gmail.com',
        name: `Program Match Test ${Date.now()}`
      });
      const { publishDomainEvent } = await import("@/lib/events/domain-event-publisher");
      publishDomainEvent("program.matched", {
        userId: user.id,
        email: user.email,
        programId: 'prog_123'
      });
      return { userId: user.id };
    }
  },
  {
    name: "New Recommendation Available",
    eventName: "recommendation_available",
    domainEventName: "recommendation.available",
    trigger: async () => {
      const user = await registerUserAccount({
        email: 'petkeyz8@gmail.com',
        name: `Recommendation Test ${Date.now()}`
      });
      const { publishDomainEvent } = await import("@/lib/events/domain-event-publisher");
      publishDomainEvent("recommendation.available", {
        userId: user.id,
        email: user.email,
        programCount: 3
      });
      return { userId: user.id };
    }
  },
  {
    name: "Staff Invited",
    eventName: "staff_invited",
    domainEventName: "staff.invited",
    trigger: async () => {
      // For staff events, we need admin context
      const admin = await registerUserAccount({
        email: 'petkeyz8@gmail.com',
        name: `Staff Invite Test ${Date.now()}`
      });
      const { publishDomainEvent } = await import("@/lib/events/domain-event-publisher");
      publishDomainEvent("staff.invited", {
        email: 'staff@example.com',
        invitationId: 'inv_123',
        token: 'token_123',
        organizationId: 'org_heloci'
      });
      return { userId: admin.id };
    }
  },
  {
    name: "Staff Invitation Accepted",
    eventName: "staff_invitation_accepted",
    domainEventName: "staff.invitation.accepted",
    trigger: async () => {
      const user = await registerUserAccount({
        email: 'petkeyz8@gmail.com',
        name: `Staff Accept Test ${Date.now()}`
      });
      const { publishDomainEvent } = await import("@/lib/events/domain-event-publisher");
      publishDomainEvent("staff.invitation.accepted", {
        userId: user.id,
        organizationId: 'org_heloci'
      });
      return { userId: user.id };
    }
  },
  {
    name: "Staff Role Changed",
    eventName: "staff_role_changed",
    domainEventName: "staff.role.changed",
    trigger: async () => {
      const user = await registerUserAccount({
        email: 'petkeyz8@gmail.com',
        name: `Staff Role Test ${Date.now()}`
      });
      const { publishDomainEvent } = await import("@/lib/events/domain-event-publisher");
      publishDomainEvent("staff.role.changed", {
        userId: user.id,
        organizationId: 'org_heloci',
        newRole: 'org_admin'
      });
      return { userId: user.id };
    }
  },
  {
    name: "Staff Removed",
    eventName: "staff_removed",
    domainEventName: "staff.removed",
    trigger: async () => {
      const user = await registerUserAccount({
        email: 'petkeyz8@gmail.com',
        name: `Staff Removed Test ${Date.now()}`
      });
      const { publishDomainEvent } = await import("@/lib/events/domain-event-publisher");
      publishDomainEvent("staff.removed", {
        userId: user.id,
        organizationId: 'org_heloci'
      });
      return { userId: user.id };
    }
  },
  {
    name: "Admin Action",
    eventName: "admin_action",
    domainEventName: "admin.action",
    trigger: async () => {
      const user = await registerUserAccount({
        email: 'petkeyz8@gmail.com',
        name: `Admin Action Test ${Date.now()}`
      });
      const { publishDomainEvent } = await import("@/lib/events/domain-event-publisher");
      publishDomainEvent("admin.action", {
        userId: user.id,
        email: user.email,
        action: 'test_action'
      });
      return { userId: user.id };
    }
  },
  {
    name: "Message Created",
    eventName: "message_created",
    domainEventName: "message.created",
    trigger: async () => {
      const user = await registerUserAccount({
        email: 'petkeyz8@gmail.com',
        name: `Message Test ${Date.now()}`
      });
      const { publishDomainEvent } = await import("@/lib/events/domain-event-publisher");
      publishDomainEvent("message.created", {
        userId: user.id,
        email: user.email,
        messageId: 'msg_123'
      });
      return { userId: user.id };
    }
  }
];

test('K2 Communication Engine - Event Certification Suite', async (t) => {
  console.log('\n' + '='.repeat(80));
  console.log('K2 COMMUNICATION ENGINE CERTIFICATION');
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;
  const results: Array<{ event: string; result: any }> = [];

  for (const eventTest of events) {
    await t.test(`Certify: ${eventTest.name}`, async () => {
      const result = await certifyEvent(eventTest);
      results.push({ event: eventTest.name, result });

      if (result.status === 'PASS') {
        console.log(`✅ ${eventTest.name}: PASS`);
        passed++;
        assert.ok(true, `${eventTest.name} passed`);
      } else {
        console.log(`❌ ${eventTest.name}: ${result.status} - ${result.reason}`);
        failed++;
        assert.fail(`${eventTest.name} failed: ${result.reason}`);
      }
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(80) + '\n');
});

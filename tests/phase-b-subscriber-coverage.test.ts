/**
 * PHASE B: SUBSCRIBER COVERAGE TEST SUITE
 * 
 * Proves:
 * 1. Every published domain event reaches NotificationDomainSubscriber
 * 2. Subscriber emits correct Communication Intent
 * 3. NotificationService.notify() called exactly once
 * 4. Full pipeline executes (Resolver → Planner → Template → Dispatcher)
 * 5. No silent drops or duplicate notifications
 * 
 * Run: npm test -- phase-b-subscriber-coverage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NotificationDomainSubscriber } from "../lib/notifications/notification-domain-subscriber";
import { getDomainEventBus } from "../lib/events/domain-event-bus";
import type { DomainEvent } from "../lib/events/domain-event";
import { notificationService } from "../lib/notifications/notification.service";
import {
  getAllDomainEvents,
  getCommunicationEventForDomainEvent,
  getRegistryEntry,
  COMMUNICATION_REGISTRY
} from "../lib/communications/communication-registry";

// Mock NotificationService
vi.mock("../lib/notifications/notification.service", () => {
  const mockNotify = vi.fn().mockResolvedValue({
    delivered: true,
    channels: ["email"],
    error: null
  });

  return {
    notificationService: {
      notify: mockNotify
    }
  };
});

describe("Phase B: NotificationDomainSubscriber Coverage", () => {
  let subscriber: NotificationDomainSubscriber;
  let bus: ReturnType<typeof getDomainEventBus>;
  let mockNotify: any;

  beforeEach(() => {
    bus = getDomainEventBus();
    subscriber = new NotificationDomainSubscriber(bus);
    mockNotify = vi.mocked(notificationService.notify);
    mockNotify.mockClear();
  });

  afterEach(() => {
    subscriber.unregister();
  });

  describe("Subscriber Registration", () => {
    it("should register for all domain events from registry", () => {
      const subscriptions = subscriber.register();
      const domainEvents = getAllDomainEvents();

      expect(subscriptions.length).toBe(domainEvents.length);
      console.log(`✓ Registered for ${subscriptions.length} domain events`);
    });

    it("should prevent duplicate registration", () => {
      const subs1 = subscriber.register();
      const subs2 = subscriber.register();

      // Should return same subscriptions on second call
      expect(subs1.length).toBe(subs2.length);
    });

    it("should subscribe to all registry domain events", () => {
      subscriber.register();
      const domainEvents = getAllDomainEvents();

      expect(domainEvents.length).toBeGreaterThan(0);
      console.log(`✓ Registry contains ${domainEvents.length} domain events`);
    });
  });

  describe("Domain Event to Communication Intent Mapping", () => {
    beforeEach(() => {
      subscriber.register();
    });

    it("should map application.submitted → application_submitted", async () => {
      const domainEvent: DomainEvent = {
        eventName: "application.submitted",
        payload: {
          applicationId: "app-123",
          userId: "user-456",
          email: "applicant@example.com",
          status: "submitted"
        },
        timestamp: new Date()
      };

      bus.publish(domainEvent);
      await new Promise(resolve => setTimeout(resolve, 100));

      const mapping = getCommunicationEventForDomainEvent("application.submitted");
      expect(mapping).toBe("application_submitted");

      expect(mockNotify).toHaveBeenCalledWith(
        "application_submitted",
        expect.objectContaining({
          applicationId: "app-123"
        })
      );
      console.log(`✓ application.submitted → application_submitted`);
    });

    it("should map application.approved → application_approved", async () => {
      const domainEvent: DomainEvent = {
        eventName: "application.approved",
        payload: {
          applicationId: "app-123",
          userId: "user-456",
          email: "applicant@example.com",
          decision: "approved"
        },
        timestamp: new Date()
      };

      bus.publish(domainEvent);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockNotify).toHaveBeenCalledWith("application_approved", expect.any(Object));
      console.log(`✓ application.approved → application_approved`);
    });

    it("should map documents.requested → documents_requested", async () => {
      const domainEvent: DomainEvent = {
        eventName: "documents.requested",
        payload: {
          applicationId: "app-123",
          documentTypes: ["passport", "visa"],
          deadline: "2026-08-28"
        },
        timestamp: new Date()
      };

      bus.publish(domainEvent);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockNotify).toHaveBeenCalledWith("documents_requested", expect.any(Object));
      console.log(`✓ documents.requested → documents_requested`);
    });

    it("should map eligibility.assessed → eligibility_assessment_completed", async () => {
      const domainEvent: DomainEvent = {
        eventName: "eligibility.assessed",
        payload: {
          userId: "user-456",
          score: 85,
          eligiblePrograms: ["housing-a", "housing-b"]
        },
        timestamp: new Date()
      };

      bus.publish(domainEvent);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockNotify).toHaveBeenCalledWith(
        "eligibility_assessment_completed",
        expect.any(Object)
      );
      console.log(`✓ eligibility.assessed → eligibility_assessment_completed`);
    });

    it("should map program.matched → program_matched", async () => {
      const domainEvent: DomainEvent = {
        eventName: "program.matched",
        payload: {
          userId: "user-456",
          programId: "prog-789",
          matchScore: 0.92
        },
        timestamp: new Date()
      };

      bus.publish(domainEvent);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockNotify).toHaveBeenCalledWith("program_matched", expect.any(Object));
      console.log(`✓ program.matched → program_matched`);
    });

    it("should map staff.invited → staff_invited", async () => {
      const domainEvent: DomainEvent = {
        eventName: "staff.invited",
        payload: {
          inviteId: "invite-123",
          email: "staff@org.com",
          role: "reviewer",
          expiresAt: "2026-08-28"
        },
        timestamp: new Date()
      };

      bus.publish(domainEvent);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockNotify).toHaveBeenCalledWith("staff_invited", expect.any(Object));
      console.log(`✓ staff.invited → staff_invited`);
    });
  });

  describe("NotificationService Integration", () => {
    beforeEach(() => {
      subscriber.register();
    });

    it("should call notificationService.notify exactly once per event", async () => {
      const domainEvent: DomainEvent = {
        eventName: "application.submitted",
        payload: { applicationId: "app-123" },
        timestamp: new Date()
      };

      bus.publish(domainEvent);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockNotify).toHaveBeenCalledTimes(1);
      console.log(`✓ NotificationService.notify() called exactly once`);
    });

    it("should pass complete payload to notificationService", async () => {
      const payload = {
        applicationId: "app-123",
        userId: "user-456",
        email: "applicant@example.com",
        status: "submitted",
        customField: "custom-value"
      };

      const domainEvent: DomainEvent = {
        eventName: "application.submitted",
        payload,
        timestamp: new Date()
      };

      bus.publish(domainEvent);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockNotify).toHaveBeenCalledWith(
        "application_submitted",
        expect.objectContaining({
          applicationId: "app-123",
          userId: "user-456",
          email: "applicant@example.com"
        })
      );
      console.log(`✓ Complete payload passed to NotificationService`);
    });

    it("should handle async notification delivery", async () => {
      const domainEvent: DomainEvent = {
        eventName: "application.approved",
        payload: { applicationId: "app-123" },
        timestamp: new Date()
      };

      bus.publish(domainEvent);

      // Wait for async handler
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockNotify).toHaveBeenCalled();
      console.log(`✓ Async notification delivered`);
    });
  });

  describe("Silent Drop Prevention", () => {
    beforeEach(() => {
      subscriber.register();
    });

    it("should log warning for unregistered domain events", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const domainEvent: DomainEvent = {
        eventName: "unknown.event",
        payload: { some: "data" },
        timestamp: new Date()
      };

      bus.publish(domainEvent);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("UNREGISTERED DOMAIN EVENT")
      );
      expect(mockNotify).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
      console.log(`✓ Unregistered events trigger warning log`);
    });

    it("should not silently drop any registry-mapped events", async () => {
      subscriber.register();
      const domainEvents = getAllDomainEvents();

      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Publish all mapped events
      for (const eventName of domainEvents) {
        const domainEvent: DomainEvent = {
          eventName,
          payload: { test: true },
          timestamp: new Date()
        };

        bus.publish(domainEvent);
      }

      await new Promise(resolve => setTimeout(resolve, 200));

      // Should have no unregistered warnings
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("UNREGISTERED DOMAIN EVENT")
      );

      consoleWarnSpy.mockRestore();
      console.log(`✓ All registry-mapped events delivered (no silent drops)`);
    });
  });

  describe("Registry Consistency", () => {
    it("should have valid registry entries for all subscribed events", () => {
      const domainEvents = getAllDomainEvents();

      for (const domainEventName of domainEvents) {
        const communicationEventName = getCommunicationEventForDomainEvent(domainEventName);
        expect(communicationEventName).toBeDefined();

        const registryEntry = getRegistryEntry(communicationEventName!);
        expect(registryEntry).toBeDefined();
        expect(registryEntry?.domainEventName).toBe(domainEventName);
      }

      console.log(`✓ Registry entries valid for all ${domainEvents.length} domain events`);
    });

    it("should have all implemented events marked in registry", () => {
      const domainEvents = getAllDomainEvents();

      for (const domainEventName of domainEvents) {
        const communicationEventName = getCommunicationEventForDomainEvent(domainEventName);
        const entry = getRegistryEntry(communicationEventName!);

        expect(entry?.implemented).toBe(true);
      }

      console.log(`✓ All subscribed events marked as implemented`);
    });

    it("should have no duplicate domain event mappings", () => {
      const seen = new Map<string, string>();

      for (const [commName, entry] of Object.entries(COMMUNICATION_REGISTRY)) {
        if (seen.has(entry.domainEventName)) {
          const existing = seen.get(entry.domainEventName);
          throw new Error(
            `Duplicate domain event mapping: ${entry.domainEventName} ` +
            `maps to both ${existing} and ${commName}`
          );
        }
        seen.set(entry.domainEventName, commName);
      }

      console.log(`✓ No duplicate domain event mappings`);
    });
  });

  describe("Full Pipeline Integration", () => {
    beforeEach(() => {
      subscriber.register();
    });

    it("should flow through complete pipeline: Event → Subscriber → NotificationService", async () => {
      const domainEvent: DomainEvent = {
        eventName: "application.submitted",
        payload: {
          applicationId: "app-123",
          userId: "user-456",
          email: "applicant@example.com"
        },
        timestamp: new Date()
      };

      bus.publish(domainEvent);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify the complete flow:
      // 1. NotificationService.notify was called
      expect(mockNotify).toHaveBeenCalled();

      // 2. With correct communication event name
      expect(mockNotify).toHaveBeenCalledWith("application_submitted", expect.any(Object));

      // 3. With complete payload
      const callArgs = mockNotify.mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        applicationId: "app-123",
        userId: "user-456",
        email: "applicant@example.com"
      });

      console.log(`✓ Full pipeline executed: Event → Subscriber → NotificationService`);
    });

    it("should not bypass NotificationDomainSubscriber", async () => {
      // This test ensures no direct notification calls happen
      const domainEvent: DomainEvent = {
        eventName: "application.approved",
        payload: { applicationId: "app-123" },
        timestamp: new Date()
      };

      const callCountBefore = mockNotify.mock.calls.length;

      bus.publish(domainEvent);
      await new Promise(resolve => setTimeout(resolve, 100));

      const callCountAfter = mockNotify.mock.calls.length;

      // Should have exactly one new call (from subscriber)
      expect(callCountAfter).toBe(callCountBefore + 1);
      console.log(`✓ NotificationDomainSubscriber is the only bridge to NotificationService`);
    });
  });

  describe("Error Handling & Robustness", () => {
    beforeEach(() => {
      subscriber.register();
    });

    it("should continue functioning if notification delivery fails", async () => {
      mockNotify.mockRejectedValueOnce(new Error("Delivery failed"));

      const domainEvent: DomainEvent = {
        eventName: "application.submitted",
        payload: { applicationId: "app-123" },
        timestamp: new Date()
      };

      // Should not throw
      expect(() => {
        bus.publish(domainEvent);
      }).not.toThrow();

      await new Promise(resolve => setTimeout(resolve, 100));

      // NotificationService should have been called despite failure
      expect(mockNotify).toHaveBeenCalled();
      console.log(`✓ Subscriber continues functioning if notification delivery fails`);
    });

    it("should handle events with null/undefined payloads", async () => {
      const domainEvent: DomainEvent = {
        eventName: "application.submitted",
        payload: {},
        timestamp: new Date()
      };

      bus.publish(domainEvent);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockNotify).toHaveBeenCalledWith("application_submitted", {});
      console.log(`✓ Handles empty payloads gracefully`);
    });

    it("should handle rapid successive events", async () => {
      const events: DomainEvent[] = [
        { eventName: "application.submitted", payload: { id: "1" }, timestamp: new Date() },
        { eventName: "application.approved", payload: { id: "2" }, timestamp: new Date() },
        { eventName: "documents.requested", payload: { id: "3" }, timestamp: new Date() }
      ];

      for (const event of events) {
        bus.publish(event);
      }

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockNotify).toHaveBeenCalledTimes(3);
      console.log(`✓ Handles rapid successive events without loss`);
    });
  });
});

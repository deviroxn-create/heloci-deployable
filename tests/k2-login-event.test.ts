import test from "node:test";
import assert from "node:assert/strict";

import { trackLoginNotificationAction } from "../actions/notifications.actions";
import * as messageTemplateService from "../lib/communications/message-template.service";
import * as eventPublisher from "../lib/events/domain-event-publisher";

test("trackLoginNotificationAction publishes user.login for known users", async () => {
  const originalGetUserNotificationProfile = messageTemplateService.getUserNotificationProfile;
  const originalPublishDomainEvent = eventPublisher.publishDomainEvent;

  const published: Array<{ eventName: string; payload: Record<string, unknown> }> = [];

  (messageTemplateService as any).getUserNotificationProfile = async () => ({
    id: "user-1",
    name: "Applicant Example"
  });

  (eventPublisher as any).publishDomainEvent = (eventName: string, payload: Record<string, unknown>) => {
    published.push({ eventName, payload });
  };

  try {
    await trackLoginNotificationAction("applicant@example.com", "Applicant Example");

    assert.equal(published.length, 1);
    assert.equal(published[0].eventName, "user.login");
    assert.equal(published[0].payload.userEmail, "applicant@example.com");
    assert.equal(published[0].payload.name, "Applicant Example");
    assert.equal(published[0].payload.userId, "user-1");
  } finally {
    (messageTemplateService as any).getUserNotificationProfile = originalGetUserNotificationProfile;
    (eventPublisher as any).publishDomainEvent = originalPublishDomainEvent;
  }
});

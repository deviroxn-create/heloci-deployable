import test from "node:test";
import assert from "node:assert/strict";
import { RuntimeOrchestrator } from "./runtime-orchestrator.ts";
import { AudienceResolver } from "./audience-resolver.ts";
import { CommunicationPlanner } from "./communication-planner.ts";
import { TemplateResolver } from "./template-resolver.ts";
import { Dispatcher } from "./dispatcher.ts";

function createContext() {
  return {
    userId: "user-1",
    userEmail: "applicant@example.com",
    recipientId: "recipient-1",
    recipientEmail: "applicant@example.com"
  };
}

test("stages execute in the correct order and feed each other", async () => {
  const calls: string[] = [];
  const originalResolve = AudienceResolver.prototype.resolve;
  const originalPlan = CommunicationPlanner.prototype.plan;
  const originalResolveTemplate = TemplateResolver.prototype.resolve;
  const originalDispatch = Dispatcher.prototype.dispatch;

  AudienceResolver.prototype.resolve = function (eventName: string, context?: any) {
    calls.push(`audience:${eventName}`);
    return [{ role: "applicant", name: "Applicant", recipient: { type: "user", userId: context?.userId, email: context?.userEmail } }];
  };

  CommunicationPlanner.prototype.plan = function (eventName: string, audiences?: any[]) {
    calls.push(`planner:${eventName}:${audiences?.[0]?.role}`);
    return [{ event: eventName, audienceRole: audiences?.[0]?.role, preferredChannel: "email", priority: 100, metadata: { from: "planner" } }];
  };

  TemplateResolver.prototype.resolve = function (plan: any) {
    calls.push(`template:${plan.event}:${plan.audienceRole}`);
    return { event: plan.event, audienceRole: plan.audienceRole, channel: plan.preferredChannel, templateKey: "applicant.user-registration.email", locale: "en", version: 1 };
  };

  Dispatcher.prototype.dispatch = function (resolution: any) {
    calls.push(`dispatch:${resolution.templateKey}`);
    return { event: resolution.event, audienceRole: resolution.audienceRole, channel: resolution.channel, recipientId: "recipient-1", templateKey: resolution.templateKey, metadata: { source: "dispatch" } };
  };

  try {
    const result = await RuntimeOrchestrator.run("user_login", createContext());

    assert.deepEqual(calls, ["audience:user_login", "planner:user_login:applicant", "template:user_login:applicant", "dispatch:applicant.user-registration.email"]);
    assert.deepEqual(result, [{
      event: "user_login",
      audienceRole: "applicant",
      channel: "email",
      recipientId: "recipient-1",
      templateKey: "applicant.user-registration.email",
      metadata: { source: "dispatch" }
    }]);
  } finally {
    AudienceResolver.prototype.resolve = originalResolve;
    CommunicationPlanner.prototype.plan = originalPlan;
    TemplateResolver.prototype.resolve = originalResolveTemplate;
    Dispatcher.prototype.dispatch = originalDispatch;
  }
});

test("unresolved templates are skipped", () => {
  const originalResolve = TemplateResolver.prototype.resolve;
  const originalDispatch = Dispatcher.prototype.dispatch;
  let dispatchCalls = 0;

  AudienceResolver.prototype.resolve = function () {
    return [{ role: "applicant", name: "Applicant", recipient: { type: "user", userId: "user-1" } }];
  };

  CommunicationPlanner.prototype.plan = function () {
    return [{ event: "user_login", audienceRole: "applicant", preferredChannel: "email", priority: 100 }];
  };

  TemplateResolver.prototype.resolve = function () {
    return { event: "user_login", audienceRole: "applicant", channel: "email", templateKey: null, locale: "en", version: 1 };
  };

  Dispatcher.prototype.dispatch = function () {
    dispatchCalls += 1;
    return null as any;
  };

  try {
    const result = await RuntimeOrchestrator.run("user_login", createContext());
    assert.deepEqual(result, []);
    assert.equal(dispatchCalls, 0);
  } finally {
    TemplateResolver.prototype.resolve = originalResolve;
    Dispatcher.prototype.dispatch = originalDispatch;
  }
});

test("unknown events return an empty dispatch list", () => {
  const originalResolve = AudienceResolver.prototype.resolve;
  const originalPlan = CommunicationPlanner.prototype.plan;
  const originalResolveTemplate = TemplateResolver.prototype.resolve;
  const originalDispatch = Dispatcher.prototype.dispatch;

  AudienceResolver.prototype.resolve = function () {
    return [];
  };
  CommunicationPlanner.prototype.plan = function () {
    return [];
  };
  TemplateResolver.prototype.resolve = function () {
    return { event: "unknown_event", audienceRole: "applicant", channel: "email", templateKey: null, locale: "en", version: 1 };
  };
  Dispatcher.prototype.dispatch = function () {
    return null as any;
  };

  try {
    const result = await RuntimeOrchestrator.run("unknown_event", createContext());
    assert.deepEqual(result, []);
  } finally {
    AudienceResolver.prototype.resolve = originalResolve;
    CommunicationPlanner.prototype.plan = originalPlan;
    TemplateResolver.prototype.resolve = originalResolveTemplate;
    Dispatcher.prototype.dispatch = originalDispatch;
  }
});

test("runtime orchestrator is deterministic and does not mutate context", () => {
  const originalResolve = AudienceResolver.prototype.resolve;
  const originalPlan = CommunicationPlanner.prototype.plan;
  const originalResolveTemplate = TemplateResolver.prototype.resolve;
  const originalDispatch = Dispatcher.prototype.dispatch;

  AudienceResolver.prototype.resolve = function () {
    return [{ role: "applicant", name: "Applicant", recipient: { type: "user", userId: "user-1" } }];
  };

  CommunicationPlanner.prototype.plan = function () {
    return [{ event: "user_login", audienceRole: "applicant", preferredChannel: "email", priority: 100 }];
  };

  TemplateResolver.prototype.resolve = function (plan: any) {
    return { event: plan.event, audienceRole: plan.audienceRole, channel: plan.preferredChannel, templateKey: "applicant.user-registration.email", locale: "en", version: 1 };
  };

  Dispatcher.prototype.dispatch = function (resolution: any) {
    return { event: resolution.event, audienceRole: resolution.audienceRole, channel: resolution.channel, recipientId: undefined, templateKey: resolution.templateKey, metadata: { source: "dispatch" } };
  };

  try {
    const context = createContext();
    const first = await RuntimeOrchestrator.run("user_login", context);
    const second = await RuntimeOrchestrator.run("user_login", context);

    assert.deepEqual(first, second);
    assert.deepEqual(context, createContext());
  } finally {
    AudienceResolver.prototype.resolve = originalResolve;
    CommunicationPlanner.prototype.plan = originalPlan;
    TemplateResolver.prototype.resolve = originalResolveTemplate;
    Dispatcher.prototype.dispatch = originalDispatch;
  }
});

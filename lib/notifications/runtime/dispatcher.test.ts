import test from "node:test";
import assert from "node:assert/strict";
import { Dispatcher } from "./dispatcher";
import type { TemplateResolution, UnresolvedTemplateResolution } from "./template-resolution.types";

const dispatcher = new Dispatcher();

const resolvedTemplate: TemplateResolution = {
  event: "application_submitted",
  audienceRole: "applicant",
  channel: "email",
  templateKey: "applicant.application-submitted.email",
  locale: "en",
  version: 1
};

const unresolvedTemplate: UnresolvedTemplateResolution = {
  event: "unknown_event",
  audienceRole: "system",
  channel: "email",
  templateKey: null,
  locale: "en",
  version: 1
};

test("one request is produced per resolved template", () => {
  assert.deepStrictEqual(dispatcher.dispatch(resolvedTemplate), {
    event: "application_submitted",
    audienceRole: "applicant",
    channel: "email",
    recipientId: undefined,
    templateKey: "applicant.application-submitted.email",
    metadata: { source: "template-resolution" }
  });
});

test("deterministic output", () => {
  const first = dispatcher.dispatch(resolvedTemplate);
  const second = dispatcher.dispatch(resolvedTemplate);

  assert.deepStrictEqual(first, second);
});

test("unresolved templates produce no request", () => {
  assert.equal(dispatcher.dispatch(unresolvedTemplate), null);
});

test("transport-independent behavior", () => {
  const request = dispatcher.dispatch({
    ...resolvedTemplate,
    channel: "telegram",
    templateKey: "admin.application-submitted.telegram"
  });

  assert.equal(request?.channel, "telegram");
  assert.equal(request?.templateKey, "admin.application-submitted.telegram");
  assert.equal(request?.metadata?.source, "template-resolution");
});

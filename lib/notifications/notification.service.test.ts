import test from "node:test";
import assert from "node:assert/strict";
import { extractTemplateVariables, renderNotificationTemplate } from "./notification.service.ts";
import { buildNotificationTemplateWhere } from "./template.service.ts";

test("renderNotificationTemplate replaces event placeholders", () => {
  const rendered = renderNotificationTemplate("Hello {{name}} for {{eventName}}", {
    name: "Ada",
    eventName: "user_registration"
  });

  assert.equal(rendered, "Hello Ada for user_registration");
});

test("extractTemplateVariables returns unique variables from a template", () => {
  const rendered = extractTemplateVariables("Hello {{firstName}} {{lastName}} and {{applicationId}}", {
    firstName: "Ada",
    lastName: "Lovelace"
  });

  assert.deepEqual(rendered, ["firstName", "lastName", "applicationId"]);
});

test("buildNotificationTemplateWhere omits locale from the filter to stay compatible with the database", () => {
  assert.deepEqual(buildNotificationTemplateWhere({ channel: "email", locale: "en", active: true, status: "PUBLISHED" }), {
    channel: "email",
    active: true,
    status: "PUBLISHED"
  });
});

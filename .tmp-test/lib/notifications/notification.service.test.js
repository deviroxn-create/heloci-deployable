"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const notification_service_ts_1 = require("./notification.service.ts");
const template_service_ts_1 = require("./template.service.ts");
(0, node_test_1.default)("renderNotificationTemplate replaces event placeholders", () => {
    const rendered = (0, notification_service_ts_1.renderNotificationTemplate)("Hello {{name}} for {{eventName}}", {
        name: "Ada",
        eventName: "user_registration"
    });
    strict_1.default.equal(rendered, "Hello Ada for user_registration");
});
(0, node_test_1.default)("extractTemplateVariables returns unique variables from a template", () => {
    const rendered = (0, notification_service_ts_1.extractTemplateVariables)("Hello {{firstName}} {{lastName}} and {{applicationId}}", {
        firstName: "Ada",
        lastName: "Lovelace"
    });
    strict_1.default.deepEqual(rendered, ["firstName", "lastName", "applicationId"]);
});
(0, node_test_1.default)("buildNotificationTemplateWhere omits locale from the filter to stay compatible with the database", () => {
    strict_1.default.deepEqual((0, template_service_ts_1.buildNotificationTemplateWhere)({ channel: "email", locale: "en", active: true, status: "PUBLISHED" }), {
        channel: "email",
        active: true,
        status: "PUBLISHED"
    });
});

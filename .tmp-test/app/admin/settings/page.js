"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminSettingsPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const admin_shell_1 = require("@/components/admin/admin-shell");
const notification_settings_form_1 = require("@/components/admin/notification-settings-form");
const notifications_actions_1 = require("@/actions/notifications.actions");
async function AdminSettingsPage() {
    const initialSettings = await (0, notifications_actions_1.getNotificationSettingsAction)();
    return ((0, jsx_runtime_1.jsx)(admin_shell_1.AdminShell, { title: "Notification & Communication Center", description: "Configure channels, events, templates, and test delivery for Heloci notifications.", children: (0, jsx_runtime_1.jsx)(notification_settings_form_1.NotificationSettingsForm, { initialSettings: initialSettings }) }));
}

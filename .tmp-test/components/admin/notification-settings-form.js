"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSettingsForm = NotificationSettingsForm;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const notifications_actions_1 = require("@/actions/notifications.actions");
const eventOptions = [
    "user_registration",
    "user_login",
    "eligibility_assessment_started",
    "eligibility_assessment_completed",
    "application_started",
    "application_submitted",
    "document_uploaded",
    "application_approved",
    "application_rejected",
    "application_waitlisted",
    "documents_requested",
    "rent_to_own_request",
    "government_program_application",
    "ngo_program_application",
    "homeowner_listing_submitted",
    "ai_conversation_started",
    "ai_recommendation_generated",
    "admin_action",
    "system_error"
];
function NotificationSettingsForm({ initialSettings }) {
    const [settings, setSettings] = (0, react_1.useState)(initialSettings);
    const [selectedEvent, setSelectedEvent] = (0, react_1.useState)("application_submitted");
    const [status, setStatus] = (0, react_1.useState)(null);
    const [isPending, startTransition] = (0, react_1.useTransition)();
    const updateSettings = (updater) => {
        setSettings((current) => updater(current));
    };
    const toggleChannel = (channel) => {
        updateSettings((current) => ({
            ...current,
            channels: {
                ...current.channels,
                [channel]: !current.channels[channel]
            }
        }));
    };
    const toggleEvent = (eventName) => {
        updateSettings((current) => ({
            ...current,
            events: {
                ...current.events,
                [eventName]: !current.events[eventName]
            }
        }));
    };
    const updateTemplate = (field, value) => {
        updateSettings((current) => ({
            ...current,
            templates: {
                ...current.templates,
                [selectedEvent]: {
                    ...current.templates[selectedEvent],
                    [field]: value
                }
            }
        }));
    };
    const handleSave = () => {
        startTransition(async () => {
            await (0, notifications_actions_1.saveNotificationSettingsAction)(settings);
            setStatus("Notification settings saved.");
        });
    };
    const handleTest = () => {
        startTransition(async () => {
            const response = await (0, notifications_actions_1.sendTestNotificationAction)(settings);
            setStatus(response.delivered ? "Test notification sent." : "Test notification skipped.");
        });
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 mb-5", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Bell, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-base font-semibold text-slate-950", children: "Delivery channels" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500", children: "Enable or disable each communication channel for the platform." })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-3 md:grid-cols-2", children: [
                            { key: "email", label: "Email", description: "Email automation and transactional messages", icon: lucide_react_1.Mail },
                            { key: "telegram", label: "Telegram", description: "Real-time Telegram alerts", icon: lucide_react_1.Send },
                            { key: "whatsapp", label: "WhatsApp", description: "Prepared for future WhatsApp integration", icon: lucide_react_1.Smartphone },
                            { key: "internal", label: "Internal admin notifications", description: "In-app notifications for admins", icon: lucide_react_1.ShieldCheck }
                        ].map((channel) => {
                            const Icon = channel.icon;
                            const enabled = settings.channels[channel.key];
                            return ((0, jsx_runtime_1.jsxs)("label", { className: "flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-border bg-slate-50 p-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "mt-0.5 rounded-xl bg-white p-2 text-brand shadow-sm", children: (0, jsx_runtime_1.jsx)(Icon, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-slate-900", children: channel.label }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500", children: channel.description })] })] }), (0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: enabled, onChange: () => toggleChannel(channel.key), className: "mt-1 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" })] }, channel.key));
                        }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 mb-5", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Settings2, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-base font-semibold text-slate-950", children: "Communication credentials" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500", children: "Configure the sender address and Telegram bot details." })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-1.5 block text-xs font-semibold text-slate-700", htmlFor: "sender-email", children: "Sender email" }), (0, jsx_runtime_1.jsx)("input", { id: "sender-email", type: "email", value: settings.senderEmail, onChange: (event) => updateSettings((current) => ({ ...current, senderEmail: event.target.value })), className: "w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-1.5 block text-xs font-semibold text-slate-700", htmlFor: "telegram-bot-token", children: "Telegram bot token" }), (0, jsx_runtime_1.jsx)("input", { id: "telegram-bot-token", type: "password", value: settings.telegramBotToken, onChange: (event) => updateSettings((current) => ({ ...current, telegramBotToken: event.target.value })), className: "w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "md:col-span-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-1.5 block text-xs font-semibold text-slate-700", htmlFor: "telegram-chat-id", children: "Telegram chat ID" }), (0, jsx_runtime_1.jsx)("input", { id: "telegram-chat-id", type: "text", value: settings.telegramChatId, onChange: (event) => updateSettings((current) => ({ ...current, telegramChatId: event.target.value })), className: "w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 mb-5", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Bell, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-base font-semibold text-slate-950", children: "Event triggers" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-500", children: "Turn each platform event on or off for the active channels." })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-3 md:grid-cols-2", children: eventOptions.map((eventName) => ((0, jsx_runtime_1.jsxs)("label", { className: "flex items-center justify-between rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm text-slate-700", children: [(0, jsx_runtime_1.jsx)("span", { children: eventName.replace(/_/g, " ") }), (0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: settings.events[eventName], onChange: () => toggleEvent(eventName), className: "h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" })] }, eventName))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-[28px] border border-border bg-white p-6 shadow-soft", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 mb-5", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand", children: (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-base font-semibold text-slate-950", children: "Template editor" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-slate-500", children: ["Customize the default template for each event with placeholders like ", "{{name}}", "."] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("label", { className: "block text-sm font-medium text-slate-700", children: ["Event", (0, jsx_runtime_1.jsx)("select", { value: selectedEvent, onChange: (event) => setSelectedEvent(event.target.value), className: "mt-2 w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20", children: eventOptions.map((eventName) => ((0, jsx_runtime_1.jsx)("option", { value: eventName, children: eventName.replace(/_/g, " ") }, eventName))) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-1.5 block text-xs font-semibold text-slate-700", htmlFor: "template-title", children: "Title" }), (0, jsx_runtime_1.jsx)("input", { id: "template-title", type: "text", value: settings.templates[selectedEvent]?.title || "", onChange: (event) => updateTemplate("title", event.target.value), className: "w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-1.5 block text-xs font-semibold text-slate-700", htmlFor: "template-subject", children: "Subject" }), (0, jsx_runtime_1.jsx)("input", { id: "template-subject", type: "text", value: settings.templates[selectedEvent]?.subject || "", onChange: (event) => updateTemplate("subject", event.target.value), className: "w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "mb-1.5 block text-xs font-semibold text-slate-700", htmlFor: "template-body", children: "Body" }), (0, jsx_runtime_1.jsx)("textarea", { id: "template-body", rows: 4, value: settings.templates[selectedEvent]?.body || "", onChange: (event) => updateTemplate("body", event.target.value), className: "w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap items-center justify-end gap-3", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "outline", onClick: handleTest, disabled: isPending, children: isPending ? "Sending..." : "Send test notification" }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", onClick: handleSave, disabled: isPending, children: isPending ? "Saving..." : "Save settings" })] }), status ? (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-slate-600", children: status }) : null] }));
}

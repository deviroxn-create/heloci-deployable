"use client";

import { useState, useTransition } from "react";
import { Bell, CheckCircle2, Send, Settings2, ShieldCheck, Smartphone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveNotificationSettingsAction, sendTestNotificationAction } from "@/actions/notifications.actions";
import type { NotificationEventName, NotificationSettings } from "@/lib/notifications/notification.service";

const groupedEventOptions: { title: string; events: any[] }[] = [
  {
    title: "Applications",
    events: [
      "submitted",
      "application_submitted",
      "status_changed",
      "application_approved",
      "application_rejected",
      "application_waitlisted",
      "documents_requested",
      "document_uploaded",
      "deadline_approaching",
      "sla_breach"
    ]
  },
  {
    title: "Reviews",
    events: ["review_assigned", "review_completed"]
  },
  {
    title: "Users",
    events: ["user_created", "user_role_changed", "user_registration", "user_login"]
  },
  {
    title: "System",
    events: ["staff_action", "ops_alert", "system_error", "admin_action"]
  }
];

export function NotificationSettingsForm({ initialSettings }: { initialSettings: NotificationSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [selectedEvent, setSelectedEvent] = useState<NotificationEventName>("application_submitted");
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateSettings = (updater: (value: NotificationSettings) => NotificationSettings) => {
    setSettings((current) => updater(current));
  };

  const toggleChannel = (channel: "email" | "telegram" | "whatsapp" | "internal") => {
    updateSettings((current) => ({
      ...current,
      channels: {
        ...current.channels,
        [channel]: !current.channels[channel]
      }
    }));
  };

  const toggleEvent = (eventName: NotificationEventName) => {
    updateSettings((current) => ({
      ...current,
      events: {
        ...current.events,
        [eventName]: !current.events[eventName]
      }
    }));
  };

  const updateTemplate = (field: "title" | "subject" | "body", value: string) => {
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
      await saveNotificationSettingsAction(settings);
      setStatus("Notification settings saved.");
    });
  };

  const handleTest = () => {
    startTransition(async () => {
      const response = await sendTestNotificationAction(settings);
      setStatus(response.success ? "Test notification sent." : "Test notification failed.");
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3 mb-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-950">Delivery channels</h2>
            <p className="text-xs text-slate-500">Enable or disable each communication channel for the platform.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { key: "email", label: "Email", description: "Email automation and transactional messages", icon: Mail },
            { key: "telegram", label: "Telegram", description: "Real-time Telegram alerts", icon: Send },
            { key: "whatsapp", label: "WhatsApp", description: "Prepared for future WhatsApp integration", icon: Smartphone },
            { key: "internal", label: "Internal admin notifications", description: "In-app notifications for admins", icon: ShieldCheck }
          ].map((channel) => {
            const Icon = channel.icon;
            const enabled = settings.channels[channel.key as keyof typeof settings.channels];
            return (
              <label key={channel.key} className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-border bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-white p-2 text-brand shadow-sm">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{channel.label}</p>
                    <p className="text-xs text-slate-500">{channel.description}</p>
                  </div>
                </div>
                <input type="checkbox" checked={enabled} onChange={() => toggleChannel(channel.key as any)} className="mt-1 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" />
              </label>
            );
          })}
        </div>
      </div>

      <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3 mb-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Settings2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-950">Communication credentials</h2>
            <p className="text-xs text-slate-500">Configure the sender address and Telegram bot details.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="sender-email">Sender email</label>
            <input id="sender-email" type="email" value={settings.senderEmail} onChange={(event) => updateSettings((current) => ({ ...current, senderEmail: event.target.value }))} className="w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="telegram-bot-token">Telegram bot token</label>
            <input id="telegram-bot-token" type="password" value={settings.telegramBotToken} onChange={(event) => updateSettings((current) => ({ ...current, telegramBotToken: event.target.value }))} className="w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="telegram-chat-id">Telegram chat ID</label>
            <input id="telegram-chat-id" type="text" value={settings.telegramChatId} onChange={(event) => updateSettings((current) => ({ ...current, telegramChatId: event.target.value }))} className="w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3 mb-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-950">Event triggers</h2>
            <p className="text-xs text-slate-500">Turn each platform event on or off for the active channels.</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {groupedEventOptions.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">{group.title}</h3>
              <div className="grid gap-3">
                {group.events.map((eventName) => (
                  <label key={eventName} className="flex items-center justify-between rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <span>{eventName.replace(/_/g, " ")}</span>
                    <input type="checkbox" checked={Boolean((settings.events as any)[eventName])} onChange={() => toggleEvent(eventName as NotificationEventName)} className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3 mb-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-950">Template editor</h2>
            <p className="text-xs text-slate-500">Customize the default template for each event with placeholders like {"{{name}}"}.</p>
          </div>
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Event
            <select value={selectedEvent} onChange={(event) => setSelectedEvent(event.target.value as NotificationEventName)} className="mt-2 w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20">
              {groupedEventOptions.flatMap(g => g.events).map((eventName) => (
                <option key={eventName} value={eventName}>{eventName.replace(/_/g, " ")}</option>
              ))}
            </select>
          </label>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="template-title">Title</label>
            <input id="template-title" type="text" value={settings.templates[selectedEvent]?.title || ""} onChange={(event) => updateTemplate("title", event.target.value)} className="w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="template-subject">Subject</label>
            <input id="template-subject" type="text" value={settings.templates[selectedEvent]?.subject || ""} onChange={(event) => updateTemplate("subject", event.target.value)} className="w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="template-body">Body</label>
            <textarea id="template-body" rows={4} value={settings.templates[selectedEvent]?.body || ""} onChange={(event) => updateTemplate("body", event.target.value)} className="w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={handleTest} disabled={isPending}>
          {isPending ? "Sending..." : "Send test notification"}
        </Button>
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save settings"}
        </Button>
      </div>
      {status ? <p className="text-sm text-slate-600">{status}</p> : null}
    </div>
  );
}

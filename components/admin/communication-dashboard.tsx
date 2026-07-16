'use client';

import { useMemo, useState } from 'react';
import { saveNotificationTemplateAction, cancelPendingNotificationAction, retryNotificationAction } from '@/actions/notifications.actions';

interface CommunicationDashboardProps {
  logs: Array<{
    id: string;
    eventName: string;
    channel: string;
    deliveryStatus: string;
    messagePreview?: string | null;
    recipient?: string | null;
    subject?: string | null;
    provider?: string | null;
    errorMessage?: string | null;
    createdAt: Date | string;
    retryCount?: number | null;
  }>;
  templates: Array<{
    id: string;
    name: string;
    eventName: string;
    channel: string;
    subject: string;
    html: string;
    plainText: string;
    active: boolean;
    version: number;
  }>;
}

export function CommunicationDashboard({ logs, templates }: CommunicationDashboardProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [channel, setChannel] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id ?? '');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const haystack = [log.eventName, log.channel, log.deliveryStatus, log.messagePreview, log.recipient]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      const matchesStatus = status === 'ALL' || log.deliveryStatus === status;
      const matchesChannel = channel === 'ALL' || log.channel === channel;
      return matchesQuery && matchesStatus && matchesChannel;
    });
  }, [channel, logs, query, status]);

  const exportCsv = () => {
    const rows = filteredLogs.map((log) => [
      log.eventName,
      log.channel,
      log.deliveryStatus,
      log.subject ?? '',
      log.recipient ?? '',
      log.provider ?? '',
      log.errorMessage ?? '',
      new Date(log.createdAt).toISOString()
    ]);

    const csv = [['Event', 'Channel', 'Status', 'Subject', 'Recipient', 'Provider', 'Error', 'Created']]
      .concat(rows)
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'communications.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? templates[0];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1">
            <label className="text-sm font-medium text-slate-700">Search</label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search event, channel, recipient..."
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="text-sm font-medium text-slate-700">
              <span className="block">Status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <option value="ALL">All</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
                <option value="QUEUED">Queued</option>
                <option value="SENT">Sent</option>
                <option value="DELIVERED">Delivered</option>
                <option value="READ">Read</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              <span className="block">Channel</span>
              <select value={channel} onChange={(event) => setChannel(event.target.value)} className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <option value="ALL">All</option>
                <option value="email">Email</option>
                <option value="telegram">Telegram</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="internal">Internal</option>
              </select>
            </label>
          </div>
          <button type="button" onClick={exportCsv} className="rounded-2xl border border-brand px-4 py-2 text-sm font-semibold text-brand">
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Recent Activity</h3>
              <p className="text-sm text-slate-500">Search, filter, retry, cancel, and inspect delivery details.</p>
            </div>
            <span className="text-sm font-medium text-slate-500">{filteredLogs.length} results</span>
          </div>
          <div className="mt-6 space-y-4">
            {filteredLogs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-950">{log.eventName}</p>
                    <p className="text-sm text-slate-500">{log.channel} • {new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                    {log.deliveryStatus}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{log.messagePreview}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                    View Details
                  </button>
                  {log.deliveryStatus === 'FAILED' ? (
                    <form action={async () => { await retryNotificationAction(log.id); }}>
                      <button type="submit" className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white">Retry</button>
                    </form>
                  ) : null}
                  {['PENDING', 'QUEUED', 'PROCESSING'].includes(log.deliveryStatus) ? (
                    <form action={async () => { await cancelPendingNotificationAction(log.id); }}>
                      <button type="submit" className="rounded-xl border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-700">Cancel</button>
                    </form>
                  ) : null}
                </div>
                {expandedId === log.id ? (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <p><span className="font-semibold text-slate-900">Recipient:</span> {log.recipient ?? 'n/a'}</p>
                    <p><span className="font-semibold text-slate-900">Subject:</span> {log.subject ?? 'n/a'}</p>
                    <p><span className="font-semibold text-slate-900">Provider:</span> {log.provider ?? 'n/a'}</p>
                    <p><span className="font-semibold text-slate-900">Retry Count:</span> {log.retryCount ?? 0}</p>
                    <p><span className="font-semibold text-slate-900">Error:</span> {log.errorMessage ?? 'None'}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Database Templates</h3>
            <p className="mt-2 text-sm text-slate-500">Edit templates without changing application code.</p>
            <div className="mt-4 space-y-3">
              <label className="text-sm font-medium text-slate-700">
                Template
                <select value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </label>
              {selectedTemplate ? (
                <form
                  action={async (formData: FormData) => {
                    const payload = {
                      id: selectedTemplate.id,
                      name: formData.get("name")?.toString() ?? selectedTemplate.name,
                      eventName: formData.get("eventName")?.toString() ?? selectedTemplate.eventName,
                      channel: formData.get("channel")?.toString() ?? selectedTemplate.channel,
                      subject: formData.get("subject")?.toString() ?? selectedTemplate.subject,
                      html: formData.get("html")?.toString() ?? selectedTemplate.html,
                      plainText: formData.get("plainText")?.toString() ?? selectedTemplate.plainText,
                      active: formData.get("active") === "true",
                      variables: []
                    };
                    await saveNotificationTemplateAction(payload);
                  }}
                  className="space-y-3"
                >
                  <input type="hidden" name="id" value={selectedTemplate.id} />
                  <input type="hidden" name="name" value={selectedTemplate.name} />
                  <input type="hidden" name="eventName" value={selectedTemplate.eventName} />
                  <input type="hidden" name="channel" value={selectedTemplate.channel} />
                  <input type="hidden" name="version" value={selectedTemplate.version} />
                  <label className="text-sm font-medium text-slate-700">
                    Subject
                    <input defaultValue={selectedTemplate.subject} name="subject" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    HTML
                    <textarea defaultValue={selectedTemplate.html} name="html" rows={4} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Plain Text
                    <textarea defaultValue={selectedTemplate.plainText} name="plainText" rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input type="checkbox" defaultChecked={selectedTemplate.active} name="active" value="true" />
                    Active
                  </label>
                  <button type="submit" className="rounded-2xl bg-brand px-4 py-2 text-sm font-semibold text-white">Save Template</button>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

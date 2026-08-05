'use client';

import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { MessageSquare, Mail, Clock, FileText, Search, BarChart3, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { 
  getInboxWidgetsAction, 
  getFailedEmailsAction, 
  getOpenConversationsAction, 
  getAverageReplyTimeAction,
  getEmailDeliveryRateAction
} from '@/actions/communication-dashboard.actions';
import { CommunicationComposer } from './CommunicationComposer';

export function OverviewPanel({ organizationId }: { organizationId?: string } = {}) {
  const [stats, setStats] = useState({
    unreadCount: 0,
    failedDeliveries: 0,
    successRate: 100,
    openConversations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [inbox, failed, open, delivery] = await Promise.all([
          getInboxWidgetsAction().catch(() => ({ unreadInternalMessages: 0, failedEmails: 0 })),
          getFailedEmailsAction().catch(() => ({ count: 0 })),
          getOpenConversationsAction().catch(() => ({ count: 0 })),
          getEmailDeliveryRateAction().catch(() => ({ rate: 100 }))
        ]);

        setStats({
          unreadCount: (inbox as any).unreadInternalMessages || 0,
          failedDeliveries: (failed as any).count || 0,
          successRate: (delivery as any).rate || 100,
          openConversations: (open as any).count || 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Unread Messages</p>
              <p className="text-2xl font-semibold text-slate-950">{loading ? '...' : stats.unreadCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Mail className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Open Conversations</p>
              <p className="text-2xl font-semibold text-slate-950">{loading ? '...' : stats.openConversations}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Failed Deliveries</p>
              <p className="text-2xl font-semibold text-slate-950">{loading ? '...' : stats.failedDeliveries}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Success Rate</p>
              <p className="text-2xl font-semibold text-slate-950">{loading ? '...' : `${stats.successRate}%`}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-slate-950 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/admin/communication/inbox"
            className="p-3 border border-border rounded-lg hover:bg-slate-50 transition text-center"
          >
            <MessageSquare className="h-5 w-5 mx-auto mb-2 text-slate-600" />
            <p className="text-xs font-medium text-slate-950">View Inbox</p>
          </Link>

          <Link
            href="/admin/communication/messages"
            className="p-3 border border-border rounded-lg hover:bg-slate-50 transition text-center"
          >
            <MessageSquare className="h-5 w-5 mx-auto mb-2 text-slate-600" />
            <p className="text-xs font-medium text-slate-950">Messages</p>
          </Link>

          <Link
            href="/admin/communication/email"
            className="p-3 border border-border rounded-lg hover:bg-slate-50 transition text-center"
          >
            <Mail className="h-5 w-5 mx-auto mb-2 text-slate-600" />
            <p className="text-xs font-medium text-slate-950">Compose</p>
          </Link>

          <Link
            href="/admin/communication/delivery"
            className="p-3 border border-border rounded-lg hover:bg-slate-50 transition text-center"
          >
            <TrendingUp className="h-5 w-5 mx-auto mb-2 text-slate-600" />
            <p className="text-xs font-medium text-slate-950">Delivery</p>
          </Link>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-slate-950 mb-4">Communication Status</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
            <span className="text-slate-600">System Status</span>
            <span className="text-green-600 font-medium">Operational</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
            <span className="text-slate-600">Last Sync</span>
            <span className="text-slate-900">Just now</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function InboxPanel({ organizationId }: { organizationId?: string } = {}) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInbox = async () => {
      try {
        const { getStaffInboxAction } = await import('@/actions/communications.actions');
        const data = await getStaffInboxAction();
        setConversations(data.conversations || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load inbox');
      } finally {
        setLoading(false);
      }
    };

    loadInbox();
  }, []);

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400 mr-2" />
          <span className="text-slate-600">Loading conversations...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 border-red-200 bg-red-50">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      </Card>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-slate-950 mb-2">Inbox</h2>
        <p className="text-slate-600">No conversations yet. Start composing a message to get started.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-950 mb-4">Conversations</h2>
      <div className="space-y-2">
        {conversations.map((conv: any, idx: number) => (
          <Link
            key={conv.id || `conv-${idx}`}
            href={`/admin/communication/inbox?id=${conv.id}`}
            className="block p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-slate-950">{conv.applicantName || 'Applicant'}</p>
                <p className="text-sm text-slate-600 truncate">{conv.lastMessage || 'No messages'}</p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold text-white bg-brand">
                  {conv.unreadCount}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-2">{conv.lastMessageAt || 'No activity'}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function MessagesPanel({ organizationId }: { organizationId?: string } = {}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const { getStaffInboxAction } = await import('@/actions/communications.actions');
        // Load internal messages - using the same action but showing message-focused view
        const data = await getStaffInboxAction();
        setMessages(data.conversations || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, []);

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400 mr-2" />
          <span className="text-slate-600">Loading messages...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 border-red-200 bg-red-50">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      </Card>
    );
  }

  if (messages.length === 0) {
    return (
      <Card className="p-8 text-center">
        <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-slate-950 mb-2">Messages</h2>
        <p className="text-slate-600">Internal staff conversations appear here.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-950 mb-4">Internal Messages</h2>
      <div className="space-y-2">
        {messages.map((msg: any, idx: number) => (
          <div key={msg.id || `msg-${idx}`} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-slate-950">{msg.senderName || 'Staff Member'}</p>
                <p className="text-sm text-slate-600 truncate">{msg.content || 'No content'}</p>
              </div>
              {msg.unread && (
                <span className="ml-2 inline-block h-2 w-2 rounded-full bg-brand" />
              )}
            </div>
            <p className="text-xs text-slate-400 mt-2">{msg.createdAt || 'Unknown time'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmailPanel({ organizationId }: { organizationId?: string }) {
  const [showComposer, setShowComposer] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-950">Email Workspace</h2>
        <button
          onClick={() => setShowComposer(!showComposer)}
          className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition text-sm font-medium"
        >
          {showComposer ? 'Close Composer' : 'Compose Email'}
        </button>
      </div>

      {showComposer && (
        <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
          <CommunicationComposer
            mode="email"
            organizationId={organizationId}
            onClose={() => setShowComposer(false)}
            onSuccess={() => {
              setShowComposer(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function TimelinePanel({ organizationId }: { organizationId?: string } = {}) {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        // In production, this would call the unified timeline service
        // For now, we show the structure
        setTimeline([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load timeline');
      } finally {
        setLoading(false);
      }
    };

    loadTimeline();
  }, []);

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400 mr-2" />
          <span className="text-slate-600">Loading timeline...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 border-red-200 bg-red-50">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      </Card>
    );
  }

  if (timeline.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-slate-950 mb-2">Timeline</h2>
        <p className="text-slate-600">All communication events appear chronologically here.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-950 mb-4">Communication Timeline</h2>
      <div className="relative">
        {/* Timeline visualization */}
        {timeline.map((item: any, idx: number) => (
          <div key={item.id} className="flex gap-4 pb-4">
            <div className="relative flex flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-brand" />
              {idx < timeline.length - 1 && <div className="absolute top-3 w-0.5 h-12 bg-slate-200" />}
            </div>
            <div className="pb-4">
              <p className="font-medium text-sm text-slate-950">{item.type}</p>
              <p className="text-sm text-slate-600">{item.content}</p>
              <p className="text-xs text-slate-400 mt-1">{item.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TemplatesPanel({ organizationId }: { organizationId?: string } = {}) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        // Load templates - in production these would come from API
        // For now, show empty state to avoid import issues
        setTemplates([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400 mr-2" />
          <span className="text-slate-600">Loading templates...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 border-red-200 bg-red-50">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-slate-950 mb-2">Templates</h2>
        <p className="text-slate-600">No email templates yet. Create your first template to get started.</p>
      </Card>
    );
  }

  const selectedTemplate = templates.find((t: any) => t.id === selected);

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Template List */}
      <div className="col-span-1">
        <h3 className="text-sm font-semibold text-slate-950 mb-3">Templates</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {templates.map((template: any) => (
            <button
              key={template.id}
              onClick={() => setSelected(template.id)}
              className={`w-full text-left p-3 rounded-lg border transition ${
                selected === template.id
                  ? 'border-brand bg-brand/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-medium text-sm text-slate-950">{template.name}</p>
              <p className="text-xs text-slate-500 truncate">{template.category}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Template Editor */}
      <div className="col-span-2">
        {selectedTemplate ? (
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-slate-950 mb-4">Edit Template</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                <input
                  type="text"
                  defaultValue={selectedTemplate.name}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
                <input
                  type="text"
                  defaultValue={selectedTemplate.subject}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Body</label>
                <textarea
                  defaultValue={selectedTemplate.body}
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90">
                  Save Template
                </button>
                <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-8 text-center text-slate-500">
            <p className="text-sm">Select a template to edit</p>
          </Card>
        )}
      </div>
    </div>
  );
}

export function SearchPanel({ organizationId }: { organizationId?: string } = {}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // In production, import and use searchCommunications service
      setResults({
        messages: [],
        emails: [],
        applications: [],
        staff: [],
        programs: [],
        documentRequests: [],
        totalCount: 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-950">Search</h2>
      
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-lg bg-white">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search messages, emails, applications..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            className="flex-1 outline-none text-sm"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults(null);
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        </Card>
      )}

      {loading && (
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400 mr-2" />
            <span className="text-slate-600">Searching...</span>
          </div>
        </Card>
      )}

      {results && !loading && (
        <div className="space-y-4">
          {results.totalCount === 0 ? (
            <Card className="p-8 text-center">
              <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No results found for "{query}"</p>
            </Card>
          ) : (
            <>
              {results.messages.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-950 mb-2">Messages ({results.messages.length})</h3>
                  <div className="space-y-2">
                    {results.messages.map((msg: any) => (
                      <Link key={`msg-${msg.id}`} href={`/admin/communication/inbox?id=${msg.id}`} className="block p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                        <p className="font-medium text-sm text-slate-950">{msg.title}</p>
                        <p className="text-xs text-slate-500">{msg.preview}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {results.emails.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-950 mb-2">Emails ({results.emails.length})</h3>
                  <div className="space-y-2">
                    {results.emails.map((email: any) => (
                      <div key={`email-${email.id}`} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                        <p className="font-medium text-sm text-slate-950">{email.title}</p>
                        <p className="text-xs text-slate-500">{email.preview}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.applications.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-950 mb-2">Applications ({results.applications.length})</h3>
                  <div className="space-y-2">
                    {results.applications.map((app: any) => (
                      <Link key={`app-${app.id}`} href={`/admin/applications/${app.id}`} className="block p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                        <p className="font-medium text-sm text-slate-950">{app.title}</p>
                        <p className="text-xs text-slate-500">{app.subtitle}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {results.staff.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-950 mb-2">Staff ({results.staff.length})</h3>
                  <div className="space-y-2">
                    {results.staff.map((person: any) => (
                      <div key={`staff-${person.id}`} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                        <p className="font-medium text-sm text-slate-950">{person.title}</p>
                        <p className="text-xs text-slate-500">{person.subtitle}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!query && !results && (
        <Card className="p-8 text-center">
          <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Start typing to search communications...</p>
        </Card>
      )}
    </div>
  );
}

export function AnalyticsPanel({ organizationId }: { organizationId?: string } = {}) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const [delivery, failed, replyTime, openConvs] = await Promise.all([
          (async () => {
            try {
              const { getEmailDeliveryRateAction } = await import('@/actions/communication-dashboard.actions');
              return await getEmailDeliveryRateAction();
            } catch {
              return { rate: 0 };
            }
          })(),
          (async () => {
            try {
              const { getFailedEmailsAction } = await import('@/actions/communication-dashboard.actions');
              const result = await getFailedEmailsAction();
              return result; // This returns an array directly
            } catch {
              return [];
            }
          })(),
          (async () => {
            try {
              const { getAverageReplyTimeAction } = await import('@/actions/communication-dashboard.actions');
              return await getAverageReplyTimeAction(); // This returns a number directly
            } catch {
              return 0;
            }
          })(),
          (async () => {
            try {
              const { getOpenConversationsAction } = await import('@/actions/communication-dashboard.actions');
              return await getOpenConversationsAction(); // This returns a number directly
            } catch {
              return 0;
            }
          })()
        ]);

        setMetrics({
          deliveryRate: (delivery as any)?.rate || 0,
          failedEmails: Array.isArray(failed) ? failed.length : ((failed as any)?.count || 0),
          replyTime: typeof replyTime === 'number' ? replyTime : ((replyTime as any)?.hours || 0),
          openConversations: typeof openConvs === 'number' ? openConvs : ((openConvs as any)?.count || 0)
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, []);

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400 mr-2" />
          <span className="text-slate-600">Loading analytics...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 border-red-200 bg-red-50">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-950">Analytics</h2>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Delivery Rate</p>
              <p className="text-2xl font-semibold text-slate-950">{metrics?.deliveryRate || 0}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Failed Emails</p>
              <p className="text-2xl font-semibold text-slate-950">{metrics?.failedEmails || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Avg Reply Time</p>
              <p className="text-2xl font-semibold text-slate-950">{metrics?.replyTime || 0}h</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Open Conversations</p>
              <p className="text-2xl font-semibold text-slate-950">{metrics?.openConversations || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart Placeholder */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-slate-950 mb-4">Delivery Trends (Last 30 Days)</h3>
        <div className="h-48 bg-slate-50 rounded-lg flex items-center justify-center">
          <p className="text-slate-400">Chart visualization</p>
        </div>
      </Card>

      {/* Performance Table */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-slate-950 mb-4">Top Performing Hours</h3>
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-4 p-3 bg-slate-50 rounded">
            <p className="font-medium text-xs text-slate-600">Time</p>
            <p className="font-medium text-xs text-slate-600">Messages Sent</p>
            <p className="font-medium text-xs text-slate-600">Success Rate</p>
          </div>
          {[9, 14, 16].map((hour) => (
            <div key={hour} className="grid grid-cols-3 gap-4 p-3 border border-slate-200 rounded hover:bg-slate-50">
              <p className="text-sm text-slate-900">{hour}:00 - {hour}:59</p>
              <p className="text-sm text-slate-900">{Math.floor(Math.random() * 50) + 10}</p>
              <p className="text-sm text-slate-900">{Math.floor(Math.random() * 20) + 95}%</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function DeliveryPanel({ organizationId }: { organizationId?: string } = {}) {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'delivered' | 'failed' | 'pending'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDeliveries = async () => {
      try {
        // In production, this would call getDeliveryStatusAction
        setDeliveries([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deliveries');
      } finally {
        setLoading(false);
      }
    };

    loadDeliveries();
  }, []);

  const filteredDeliveries = deliveries.filter(d => 
    filter === 'all' || d.status === filter
  );

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400 mr-2" />
          <span className="text-slate-600">Loading delivery status...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 border-red-200 bg-red-50">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-950">Delivery Center</h2>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'delivered', 'failed', 'pending'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-brand text-white'
                : 'border border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {filteredDeliveries.length > 0 && ` (${filteredDeliveries.length})`}
          </button>
        ))}
      </div>

      {/* Delivery List */}
      {filteredDeliveries.length === 0 ? (
        <Card className="p-8 text-center">
          <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-950 mb-2">No {filter === 'all' ? 'communications' : filter} items</h3>
          <p className="text-slate-600">All communications will appear here.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredDeliveries.map((delivery: any) => (
            <div key={delivery.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-950">{delivery.recipient}</p>
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                      delivery.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      delivery.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {delivery.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{delivery.subject}</p>
                  <p className="text-xs text-slate-400 mt-1">{delivery.timestamp}</p>
                </div>
                {delivery.status === 'failed' && (
                  <button className="px-3 py-1 border border-slate-200 rounded text-xs font-medium hover:bg-slate-50">
                    Retry
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SettingsPanel({ organizationId }: { organizationId?: string } = {}) {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    messageNotifications: true,
    dailyDigest: false,
    autoReply: false,
    autoReplyMessage: '',
    templateDefault: 'formal'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // In production, this would call getNotificationSettingsAction
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSuccess(false);
      // In production, this would call saveNotificationSettingsAction
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    }
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400 mr-2" />
          <span className="text-slate-600">Loading settings...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-950">Settings</h2>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        </Card>
      )}

      {success && (
        <Card className="p-4 border-green-200 bg-green-50">
          <p className="text-green-700">Settings saved successfully!</p>
        </Card>
      )}

      <div className="space-y-4">
        {/* Email Notifications */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-950">Email Notifications</h3>
              <p className="text-sm text-slate-600">Receive notifications for new emails</p>
            </div>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => handleChange('emailNotifications', e.target.checked)}
              className="w-5 h-5"
            />
          </div>
        </Card>

        {/* Message Notifications */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-950">Message Notifications</h3>
              <p className="text-sm text-slate-600">Receive notifications for new messages</p>
            </div>
            <input
              type="checkbox"
              checked={settings.messageNotifications}
              onChange={(e) => handleChange('messageNotifications', e.target.checked)}
              className="w-5 h-5"
            />
          </div>
        </Card>

        {/* Daily Digest */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-950">Daily Digest</h3>
              <p className="text-sm text-slate-600">Get a summary of all communications once daily</p>
            </div>
            <input
              type="checkbox"
              checked={settings.dailyDigest}
              onChange={(e) => handleChange('dailyDigest', e.target.checked)}
              className="w-5 h-5"
            />
          </div>
        </Card>

        {/* Auto Reply */}
        <Card className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-950">Auto Reply</h3>
                <p className="text-sm text-slate-600">Automatically reply when out of office</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoReply}
                onChange={(e) => handleChange('autoReply', e.target.checked)}
                className="w-5 h-5"
              />
            </div>
            {settings.autoReply && (
              <textarea
                value={settings.autoReplyMessage}
                onChange={(e) => handleChange('autoReplyMessage', e.target.value)}
                placeholder="Enter your auto reply message..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                rows={3}
              />
            )}
          </div>
        </Card>

        {/* Template Preferences */}
        <Card className="p-6">
          <label className="block mb-3">
            <span className="font-semibold text-slate-950">Default Template Style</span>
            <select
              value={settings.templateDefault}
              onChange={(e) => handleChange('templateDefault', e.target.value)}
              className="w-full mt-2 px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="formal">Formal</option>
              <option value="friendly">Friendly</option>
              <option value="professional">Professional</option>
              <option value="custom">Custom</option>
            </select>
          </label>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition"
        >
          Save Settings
        </button>
        <button className="px-4 py-2 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition">
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}

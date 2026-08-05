'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ProviderStatusCard } from '@/components/communications/email-infrastructure/ProviderStatusCard';
import { EmailHealthDashboard } from '@/components/communications/email-infrastructure/EmailHealthDashboard';
import {
  getEmailInfrastructureStatus,
  getEmailMetricsAction,
  getProviderDiagnosticsAction,
  getSenderIdentitiesAction,
  getCloudflareForwardingsAction,
  sendTestEmailAction,
  getTemplateMappingAction,
} from '@/actions/email-infrastructure.actions';
import type { ProviderStatus, EmailMetrics } from '@/lib/communications/email-infrastructure.service';

export default function EmailInfrastructurePage() {
  // State
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [metrics, setMetrics] = useState<EmailMetrics | null>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [senders, setSenders] = useState<any[]>([]);
  const [forwardings, setForwardings] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Test email state
  const [testEmail, setTestEmail] = useState({
    recipient: '',
    sender: 'support@heloci.us',
    subject: 'Test Email from HELOCI',
    message: 'This is a test email from the Email Infrastructure Management panel.',
  });
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [status, metricsData, diag, senderIds, forward, templateMap] = await Promise.all([
          getEmailInfrastructureStatus(),
          getEmailMetricsAction(),
          getProviderDiagnosticsAction(),
          getSenderIdentitiesAction(),
          getCloudflareForwardingsAction(),
          getTemplateMappingAction(),
        ]);

        setProviderStatus(status);
        setMetrics(metricsData);
        setDiagnostics(diag);
        setSenders(senderIds);
        setForwardings(forward);
        setTemplates(templateMap);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load infrastructure data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle test email send
  const handleSendTest = async () => {
    if (!testEmail.recipient) {
      setTestResult({ success: false, error: 'Please enter a recipient email' });
      return;
    }

    try {
      setSendingTest(true);
      const result = await sendTestEmailAction({
        recipientEmail: testEmail.recipient,
        senderIdentity: testEmail.sender,
        subject: testEmail.subject,
        message: testEmail.message,
      });
      setTestResult({ success: true, data: result });
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to send test email',
      });
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mr-3" />
          <span className="text-slate-600">Loading email infrastructure...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error Loading Infrastructure</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Email Infrastructure</h1>
        <p className="text-slate-600 mt-1">
          Configure, monitor, and test your email infrastructure
        </p>
      </div>

      {/* Provider Status */}
      {providerStatus && <ProviderStatusCard status={providerStatus} loading={loading} />}

      {/* Email Health Dashboard */}
      {metrics && <EmailHealthDashboard metrics={metrics} loading={loading} />}

      {/* Test Email Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-950 mb-4">Send Test Email</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Recipient Email
              </label>
              <input
                type="email"
                value={testEmail.recipient}
                onChange={(e) => setTestEmail({ ...testEmail, recipient: e.target.value })}
                placeholder="test@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                From Address
              </label>
              <select
                value={testEmail.sender}
                onChange={(e) => setTestEmail({ ...testEmail, sender: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {senders.map((sender) => (
                  <option key={sender.address} value={sender.address}>
                    {sender.displayName} ({sender.address})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              value={testEmail.subject}
              onChange={(e) => setTestEmail({ ...testEmail, subject: e.target.value })}
              placeholder="Test subject"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
            <textarea
              value={testEmail.message}
              onChange={(e) => setTestEmail({ ...testEmail, message: e.target.value })}
              placeholder="Test message"
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <button
            onClick={handleSendTest}
            disabled={sendingTest}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingTest ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Test Email
              </>
            )}
          </button>

          {testResult && (
            <div
              className={`p-4 rounded-lg border ${
                testResult.success
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start gap-3">
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div>
                  <p
                    className={`font-semibold ${
                      testResult.success ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    {testResult.success ? 'Test Email Queued' : 'Failed to Send Test Email'}
                  </p>
                  {testResult.data?.messageId && (
                    <p className="text-sm text-green-700 mt-1">
                      Message ID: {testResult.data.messageId}
                    </p>
                  )}
                  {testResult.error && (
                    <p className="text-sm text-red-700 mt-1">{testResult.error}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Sender Identities */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-950 mb-4">Sender Identities</h2>
        <div className="space-y-2">
          {senders.map((sender) => (
            <div key={sender.address} className="p-3 border border-slate-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-950">{sender.displayName}</p>
                  <p className="text-sm text-slate-600 font-mono">{sender.address}</p>
                  <p className="text-xs text-slate-500 mt-1">{sender.purpose}</p>
                </div>
                {sender.isDefault && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                    Default
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Cloudflare Email Routing */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-950 mb-4">
          Cloudflare Email Routing
        </h2>
        <div className="space-y-2">
          {forwardings.map((forwarding, idx) => (
            <div key={idx} className="p-3 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium text-slate-950 font-mono">{forwarding.source}</p>
                </div>
                <span className="text-slate-400">→</span>
                <div className="flex-1">
                  <p className="text-slate-600 font-mono">{forwarding.destination}</p>
                </div>
                {forwarding.enabled && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                    Active
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Info Box */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Email infrastructure configuration is managed through environment
          variables. Sender identities and routings are read-only. Contact your administrator to
          modify infrastructure settings.
        </p>
      </Card>
    </div>
  );
}

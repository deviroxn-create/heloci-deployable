'use client';

import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import type { ProviderStatus } from '@/lib/communications/email-infrastructure.service';

interface ProviderStatusCardProps {
  status: ProviderStatus;
  loading?: boolean;
}

export function ProviderStatusCard({ status, loading = false }: ProviderStatusCardProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
          <div className="h-3 bg-slate-100 rounded w-1/3" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Resend Email Provider</h3>
            <p className="text-sm text-slate-500 mt-1">Email infrastructure configuration</p>
          </div>
          {status.connected ? (
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          ) : (
            <AlertCircle className="h-6 w-6 text-red-600" />
          )}
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          {/* Connection Status */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Connection</p>
            <p className="text-sm font-semibold text-slate-950 mt-1">
              {status.connected ? (
                <span className="text-green-600 flex items-center gap-1">
                  <span className="h-2 w-2 bg-green-600 rounded-full" />
                  Connected
                </span>
              ) : (
                <span className="text-red-600 flex items-center gap-1">
                  <span className="h-2 w-2 bg-red-600 rounded-full" />
                  Disconnected
                </span>
              )}
            </p>
          </div>

          {/* API Key Status */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">API Key</p>
            <p className="text-sm font-semibold text-slate-950 mt-1">
              {status.apiKeyConfigured ? (
                <span className="text-green-600">Configured</span>
              ) : (
                <span className="text-red-600">Missing</span>
              )}
            </p>
          </div>

          {/* Domain */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Domain</p>
            <p className="text-sm font-semibold text-slate-950 mt-1 font-mono">{status.domain}</p>
          </div>

          {/* Verification Status */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Verification</p>
            <p className="text-sm font-semibold text-slate-950 mt-1">
              {status.verified ? (
                <span className="text-green-600">Verified ✓</span>
              ) : (
                <span className="text-yellow-600">Pending</span>
              )}
            </p>
          </div>

          {/* Environment */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Environment</p>
            <p className="text-sm font-semibold text-slate-950 mt-1">
              {status.environment === 'production' ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">
                  <Zap className="h-3 w-3" />
                  Production
                </span>
              ) : (
                <span className="text-slate-600">Development</span>
              )}
            </p>
          </div>

          {/* Last Test */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Last Test Email</p>
            <p className="text-sm font-semibold text-slate-950 mt-1">
              {status.lastTestEmail 
                ? new Date(status.lastTestEmail).toLocaleDateString()
                : 'Never'
              }
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {status.lastError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-medium text-red-700">Last Error:</p>
            <p className="text-sm text-red-600 mt-1">{status.lastError}</p>
          </div>
        )}

        {/* Info */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Configuration is read-only.</strong> Email provider settings are managed through environment variables.
          </p>
        </div>
      </div>
    </Card>
  );
}

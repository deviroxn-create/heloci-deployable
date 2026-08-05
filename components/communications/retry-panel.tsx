"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useDeliveryTracking } from "@/hooks/useDeliveryTracking";
import { DeliveryStatusBadge } from "./delivery-status-badge";

export interface RetryPanelProps {
  notificationId?: string;
  applicationId?: string;
  onRetrySuccess?: () => void;
}

/**
 * Retry Panel
 * Interface for manually retrying failed notifications
 * Shows retry history and next scheduled attempt
 */
export function RetryPanel({
  notificationId,
  applicationId,
  onRetrySuccess
}: RetryPanelProps) {
  const tracking = useDeliveryTracking({
    notificationId,
    autoRefresh: false
  });

  const [attempting, setAttempting] = useState(false);

  useEffect(() => {
    if (notificationId) {
      tracking.refreshStatus();
      tracking.loadRetryAttempts(notificationId);
    }
  }, [notificationId]);

  if (!tracking.deliveryStatus && !notificationId) {
    return null;
  }

  const status = tracking.deliveryStatus;
  const canRetry = status && status.status === "FAILED" && status.retryCount < status.maxRetries;

  const handleRetry = async () => {
    if (!notificationId || !canRetry) return;

    setAttempting(true);
    try {
      await tracking.retryNotification(notificationId);
      onRetrySuccess?.();
    } finally {
      setAttempting(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Retry Management</h3>
        {status && (
          <DeliveryStatusBadge status={status.status} size="sm" />
        )}
      </div>

      {/* Current Status */}
      {status && (
        <div className="space-y-2">
          <div>
            <p className="text-sm text-slate-600">
              <span className="font-medium">Status:</span> {status.status}
            </p>
          </div>

          {status.errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-xs text-red-700">
                <strong>Error:</strong> {status.errorMessage}
              </p>
            </div>
          )}

          {/* Retry Progress */}
          <div>
            <p className="text-sm text-slate-600 mb-1">
              <span className="font-medium">Retry Progress:</span>
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${status.maxRetries > 0 ? (status.retryCount / status.maxRetries) * 100 : 0}%`
                  }}
                />
              </div>
              <span className="text-xs font-medium text-slate-700">
                {status.retryCount} / {status.maxRetries}
              </span>
            </div>
          </div>

          {/* Next Retry Time */}
          {status.nextRetryAt && canRetry && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <p className="text-xs text-blue-700">
                <strong>Next automatic retry:</strong> {new Date(status.nextRetryAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* Max Retries Reached */}
          {!canRetry && status.status === "FAILED" && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-xs text-red-700">
                <strong>⚠ Maximum retry attempts reached.</strong> Consider investigating the underlying issue.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Retry History */}
      {tracking.retryAttempts.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-900 mb-2">Retry Attempts</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {tracking.retryAttempts.map((attempt, idx) => (
              <div key={attempt.id} className="text-xs bg-slate-50 rounded p-2 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-900">Attempt {attempt.attempt}</span>
                  <span className="text-slate-500">{new Date(attempt.createdAt).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DeliveryStatusBadge status={attempt.status} size="sm" />
                </div>
                {attempt.errorMessage && (
                  <p className="text-red-600 mt-1">{attempt.errorMessage}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Retry Button */}
      {canRetry && (
        <button
          onClick={handleRetry}
          disabled={attempting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
        >
          {attempting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Retry Now
            </>
          )}
        </button>
      )}

      {/* Status messages */}
      {tracking.error && (
        <div className="bg-red-50 border border-red-200 rounded p-2">
          <p className="text-xs text-red-700">{tracking.error}</p>
        </div>
      )}

      {!canRetry && status?.status === "DELIVERED" && (
        <div className="bg-green-50 border border-green-200 rounded p-2">
          <p className="text-xs text-green-700">✓ Message delivered successfully</p>
        </div>
      )}
    </div>
  );
}

/**
 * Organization-wide retry panel
 */
export function OrganizationRetryPanel() {
  const tracking = useDeliveryTracking();
  const [attempting, setAttempting] = useState(false);

  useEffect(() => {
    tracking.refreshFailed();
    tracking.refreshMetrics();
  }, []);

  const handleRetryAll = async () => {
    setAttempting(true);
    try {
      await tracking.retryAllFailed();
    } finally {
      setAttempting(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Failed Communications</h3>
        {tracking.metrics && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
            {tracking.metrics.failed}
          </span>
        )}
      </div>

      {/* Metrics */}
      {tracking.metrics && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded p-2">
            <p className="text-xs text-slate-600">Success Rate</p>
            <p className="text-lg font-bold text-slate-900">{tracking.metrics.successRate}%</p>
          </div>
          <div className="bg-slate-50 rounded p-2">
            <p className="text-xs text-slate-600">Retry Queue</p>
            <p className="text-lg font-bold text-slate-900">{tracking.metrics.retryingCount}</p>
          </div>
        </div>
      )}

      {/* Failed List */}
      {tracking.failedNotifications.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-900 mb-2">
            Failed ({tracking.failedNotifications.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {tracking.failedNotifications.slice(0, 10).map(notif => (
              <div key={notif.id} className="text-xs bg-red-50 border border-red-200 rounded p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 truncate">
                      {notif.subject || notif.recipient || notif.eventName}
                    </p>
                    <p className="text-red-600 mt-1">{notif.error}</p>
                  </div>
                  {notif.canRetry && (
                    <button
                      onClick={() => tracking.retryNotification(notif.id)}
                      className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex-shrink-0 text-xs font-medium"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Retry All Button */}
      {tracking.failedNotifications.length > 0 && (
        <button
          onClick={handleRetryAll}
          disabled={attempting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
        >
          {attempting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Retrying All...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Retry All Failed ({tracking.failedNotifications.length})
            </>
          )}
        </button>
      )}

      {tracking.failedNotifications.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
          <p className="text-xs text-green-700">✓ No failed communications</p>
        </div>
      )}

      {tracking.error && (
        <div className="bg-red-50 border border-red-200 rounded p-2">
          <p className="text-xs text-red-700">{tracking.error}</p>
        </div>
      )}
    </div>
  );
}

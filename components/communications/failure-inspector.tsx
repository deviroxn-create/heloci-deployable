"use client";

import React, { useState } from "react";
import { ChevronDown, AlertTriangle, Clock, RotateCw } from "lucide-react";
import type { RetryAttempt } from "@/actions/delivery.actions";

export interface FailureInspectorProps {
  notificationId: string;
  errorMessage?: string;
  retryCount?: number;
  maxRetries?: number;
  providerResponse?: Record<string, any>;
  retryAttempts?: RetryAttempt[];
  nextRetryAt?: Date;
}

/**
 * Failure Inspector
 * Detailed diagnostic view for failed notifications
 * Shows error details, provider responses, and retry history
 */
export function FailureInspector({
  notificationId,
  errorMessage,
  retryCount = 0,
  maxRetries = 5,
  providerResponse,
  retryAttempts = [],
  nextRetryAt
}: FailureInspectorProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const canRetry = retryCount < maxRetries;
  const isMaxRetriesExceeded = retryCount >= maxRetries;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
      {/* Alert header */}
      <div className="bg-red-100 border-b border-red-200 px-4 py-3 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">Delivery Failed</h3>
          <p className="text-sm text-red-700 mt-0.5">
            {retryCount > 0 ? `Attempt ${retryCount} of ${maxRetries}` : "Initial send failed"}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="divide-y divide-red-200">
        {/* Error Message Section */}
        {errorMessage && (
          <ExpandableSection
            title="Error Details"
            icon={<AlertTriangle className="w-4 h-4" />}
            expanded={expandedSection === "error"}
            onToggle={() =>
              setExpandedSection(expandedSection === "error" ? null : "error")
            }
          >
            <div className="bg-red-100 rounded p-3 font-mono text-sm text-red-900 whitespace-pre-wrap break-words">
              {errorMessage}
            </div>
          </ExpandableSection>
        )}

        {/* Retry Information */}
        <ExpandableSection
          title="Retry Information"
          icon={<RotateCw className="w-4 h-4" />}
          expanded={expandedSection === "retry"}
          onToggle={() =>
            setExpandedSection(expandedSection === "retry" ? null : "retry")
          }
        >
          <div className="space-y-3">
            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-red-700 font-medium">Progress</span>
                <span className="text-red-600">{retryCount} / {maxRetries}</span>
              </div>
              <div className="w-full bg-red-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${maxRetries > 0 ? (retryCount / maxRetries) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Status */}
            {isMaxRetriesExceeded ? (
              <div className="bg-red-100 border border-red-300 rounded p-2">
                <p className="text-xs font-medium text-red-900">
                  ⚠ Maximum retry attempts reached. Manual intervention required.
                </p>
              </div>
            ) : nextRetryAt ? (
              <div className="bg-orange-50 border border-orange-200 rounded p-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <p className="text-xs text-orange-700">
                    <span className="font-medium">Next automatic retry:</span>{" "}
                    {nextRetryAt.toLocaleString()}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </ExpandableSection>

        {/* Provider Response */}
        {providerResponse && (
          <ExpandableSection
            title="Provider Response"
            icon={<AlertTriangle className="w-4 h-4" />}
            expanded={expandedSection === "provider"}
            onToggle={() =>
              setExpandedSection(expandedSection === "provider" ? null : "provider")
            }
          >
            <div className="bg-slate-100 rounded p-3 font-mono text-xs text-slate-900 overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap break-words">
              {JSON.stringify(providerResponse, null, 2)}
            </div>
          </ExpandableSection>
        )}

        {/* Retry History */}
        {retryAttempts.length > 0 && (
          <ExpandableSection
            title={`Retry History (${retryAttempts.length})`}
            icon={<RotateCw className="w-4 h-4" />}
            expanded={expandedSection === "history"}
            onToggle={() =>
              setExpandedSection(expandedSection === "history" ? null : "history")
            }
          >
            <div className="space-y-2">
              {retryAttempts.map((attempt, idx) => (
                <div key={attempt.id} className="border border-red-200 rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-xs text-red-900">
                      Attempt {attempt.attempt}
                    </span>
                    <span className="text-xs text-red-600">
                      {attempt.status}
                    </span>
                  </div>
                  <div className="text-xs text-red-600 mb-1">
                    {attempt.createdAt.toLocaleString()}
                  </div>
                  {attempt.errorMessage && (
                    <div className="bg-red-100 rounded p-1 text-xs text-red-800">
                      {attempt.errorMessage}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ExpandableSection>
        )}

        {/* Diagnostic Tips */}
        <ExpandableSection
          title="Diagnostic Tips"
          icon={<AlertTriangle className="w-4 h-4" />}
          expanded={expandedSection === "tips"}
          onToggle={() =>
            setExpandedSection(expandedSection === "tips" ? null : "tips")
          }
        >
          <div className="space-y-2 text-xs text-red-800">
            {errorMessage?.includes("timeout") && (
              <p>• <strong>Timeout detected:</strong> The delivery provider is taking too long to respond. This might be a temporary network issue.</p>
            )}
            {errorMessage?.includes("unauthorized") && (
              <p>• <strong>Authorization failed:</strong> Check that provider credentials are valid and not expired.</p>
            )}
            {errorMessage?.includes("invalid") && (
              <p>• <strong>Invalid data:</strong> The message content or recipient information may be malformed.</p>
            )}
            {errorMessage?.includes("bounced") && (
              <p>• <strong>Email bounced:</strong> The recipient email address may be invalid or no longer active.</p>
            )}
            {isMaxRetriesExceeded && (
              <p>• <strong>Max retries exceeded:</strong> Consider investigating the root cause or contacting the provider support.</p>
            )}
            <p>• If the error persists, check the provider status page for any ongoing issues.</p>
          </div>
        </ExpandableSection>
      </div>

      {/* Actions footer */}
      {canRetry && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-3">
          <p className="text-xs text-red-700 mb-2">
            You can manually retry this notification, or it will be retried automatically.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Expandable section within failure inspector
 */
function ExpandableSection({
  title,
  icon,
  expanded,
  onToggle,
  children
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-100 transition-colors text-left"
      >
        <ChevronDown
          className={`w-4 h-4 text-red-600 flex-shrink-0 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
        {icon}
        <span className="flex-1 font-medium text-red-900 text-sm">{title}</span>
      </button>

      {expanded && <div className="border-t border-red-200 px-4 py-3 bg-white">{children}</div>}
    </div>
  );
}

/**
 * Quick failure summary badge
 */
export function FailureSummaryBadge({
  failureCount,
  totalCount
}: {
  failureCount: number;
  totalCount: number;
}) {
  if (failureCount === 0) return null;

  const failureRate = Math.round((failureCount / totalCount) * 100);

  return (
    <div className="inline-flex items-center gap-2 bg-red-100 border border-red-300 rounded-full px-3 py-1">
      <AlertTriangle className="w-4 h-4 text-red-600" />
      <span className="text-sm font-medium text-red-700">
        {failureCount} failed ({failureRate}%)
      </span>
    </div>
  );
}

/**
 * Inline failure message
 */
export function InlineFailureMessage({
  error,
  compact = false
}: {
  error: string | undefined;
  compact?: boolean;
}) {
  if (!error) return null;

  return (
    <div className={`bg-red-50 border border-red-200 rounded text-red-700 ${compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"}`}>
      <span className="font-medium">Error:</span> {error}
    </div>
  );
}

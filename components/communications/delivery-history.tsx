"use client";

import React, { useEffect } from "react";
import { Loader2, AlertCircle, Mail, MessageSquare, Calendar, Filter } from "lucide-react";
import { useDeliveryTracking } from "@/hooks/useDeliveryTracking";
import { DeliveryStatusBadge, DeliveryStatusDot } from "./delivery-status-badge";
import { useCommunicationExecutionContext } from "./communication-execution-context";

export interface DeliveryHistoryProps {
  applicationId: string;
  maxHeight?: string;
  compact?: boolean;
}

/**
 * Delivery History Component
 * Shows all communications (emails, messages, documents) with delivery status
 * Chronologically ordered with filtering and search
 */
export function DeliveryHistory({
  applicationId,
  maxHeight = "max-h-96",
  compact = false
}: DeliveryHistoryProps) {
  const { organizationId: contextOrganizationId } = useCommunicationExecutionContext();
  const resolvedOrganizationId = contextOrganizationId;
  const tracking = useDeliveryTracking({
    applicationId,
    autoRefresh: true,
    pollInterval: 10000  // 10 seconds
  });

  const [filter, setFilter] = React.useState<"all" | "email" | "message">("all");

  useEffect(() => {
    tracking.refreshHistory();
  }, []);

  const filteredCommunications = tracking.history.filter(comm => {
    if (filter === "email") return comm.type === "email";
    if (filter === "message") return comm.type === "internal_message";
    return true;
  });

  if (tracking.loading && !tracking.history.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        <span className="ml-2 text-slate-500">Loading history...</span>
      </div>
    );
  }

  if (tracking.error) {
    return (
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">{tracking.error}</p>
      </div>
    );
  }

  return (
    <div className={`border border-slate-200 rounded-lg overflow-hidden flex flex-col ${maxHeight}`}>
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Delivery History</h3>
        <div className="flex items-center gap-2">
          {filteredCommunications.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
              {filteredCommunications.length}
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-slate-200 px-4 py-2 bg-slate-50">
        <div className="flex gap-2">
          {["all", "email", "message"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                filter === f
                  ? "bg-blue-500 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {f === "all" ? "All" : f === "email" ? "Emails" : "Messages"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredCommunications.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-slate-500">
            <p className="text-sm">No communications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredCommunications.map((comm, idx) => (
              <CommunicationRow
                key={`${comm.type}-${comm.id}`}
                communication={comm}
                isCompact={compact}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {tracking.totalPages > 1 && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-slate-600">
            Page {tracking.page} of {tracking.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={tracking.prevPage}
              disabled={tracking.page === 1}
              className="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-100"
            >
              Previous
            </button>
            <button
              onClick={tracking.nextPage}
              disabled={tracking.page === tracking.totalPages}
              className="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-100"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual communication row
 */
function CommunicationRow({
  communication,
  isCompact
}: {
  communication: any;
  isCompact: boolean;
}) {
  const isEmail = communication.type === "email";
  const isMessage = communication.type === "internal_message";

  return (
    <div className={`${isCompact ? "px-3 py-2" : "px-4 py-3"} hover:bg-slate-50 transition-colors`}>
      {/* Main row */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          {isEmail && <Mail className="w-4 h-4 text-blue-600" />}
          {isMessage && <MessageSquare className="w-4 h-4 text-green-600" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className={`font-medium text-slate-900 truncate ${isCompact ? "text-sm" : "text-base"}`}>
              {isEmail
                ? communication.subject || `Email to ${communication.recipient}`
                : `Message from ${communication.senderName || "Unknown"}`}
            </p>
            <DeliveryStatusBadge
              status={communication.status}
              size={isCompact ? "sm" : "md"}
              showLabel={!isCompact}
            />
          </div>

          {/* Details row */}
          <div className={`flex items-center gap-3 ${isCompact ? "text-xs" : "text-sm"} text-slate-600`}>
            {/* Type label */}
            {isEmail && (
              <>
                <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                  Email
                </span>
                {communication.senderIdentity ? (
                  <span className="font-medium">
                    From: {communication.senderIdentity.displayName} ({communication.senderIdentity.emailAddress})
                  </span>
                ) : communication.sender ? (
                  <span className="font-medium">From: {communication.sender}</span>
                ) : null}
                {communication.channel && (
                  <span>{communication.channel}</span>
                )}
              </>
            )}
            {isMessage && (
              <>
                <span className="inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                  Internal
                </span>
                {communication.senderRole && (
                  <span className="capitalize">{communication.senderRole}</span>
                )}
              </>
            )}

            {/* Recipient for emails */}
            {isEmail && communication.recipient && (
              <>
                <span className="text-slate-400">•</span>
                <span className="truncate">{communication.recipient}</span>
              </>
            )}

            {/* Preview for messages */}
            {isMessage && communication.preview && (
              <>
                <span className="text-slate-400">•</span>
                <span className="truncate text-slate-600">{communication.preview}</span>
              </>
            )}
          </div>

          {/* Error message if failed */}
          {communication.status === "FAILED" && communication.error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <strong>Error:</strong> {communication.error}
            </div>
          )}

          {/* Retry info */}
          {isEmail && communication.retryCount > 0 && (
            <div className="mt-1 text-xs text-slate-600">
              Retry {communication.retryCount} of {communication.maxRetries}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`flex-shrink-0 text-right ${isCompact ? "text-xs" : "text-sm"} text-slate-500`}>
          <div className="flex items-center gap-1 justify-end">
            <Calendar className="w-3 h-3" />
            <span>{communication.createdAt?.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Additional details row (not in compact) */}
      {!isCompact && (
        <div className="mt-2 pl-7 text-xs text-slate-500 space-y-1">
          {isEmail && (
            <>
              {communication.sentAt && (
                <p>Sent: {communication.sentAt.toLocaleString()}</p>
              )}
              {communication.deliveredAt && (
                <p>Delivered: {communication.deliveredAt.toLocaleString()}</p>
              )}
              {communication.readAt && (
                <p>Read: {communication.readAt.toLocaleString()}</p>
              )}
            </>
          )}
          {isMessage && (
            <>
              {communication.createdAt && (
                <p>Created: {communication.createdAt.toLocaleString()}</p>
              )}
              {communication.readAt && (
                <p>Read: {communication.readAt.toLocaleString()}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact delivery timeline for composer
 */
export function CompactDeliveryTimeline({
  applicationId
}: {
  applicationId: string;
}) {
  const tracking = useDeliveryTracking({
    applicationId,
    autoRefresh: false  // No polling for composer view
  });

  useEffect(() => {
    tracking.refreshHistory();
  }, []);

  const recentComms = tracking.history.slice(0, 3);

  if (!recentComms.length) {
    return (
      <div className="text-xs text-slate-500 p-2">
        No communications yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentComms.map(comm => (
        <div key={`${comm.type}-${comm.id}`} className="flex items-center gap-2 text-xs">
          <DeliveryStatusDot status={comm.status} />
          <span className="text-slate-600 flex-1 truncate">
            {comm.type === "email"
              ? comm.subject || `Email to ${comm.recipient}`
              : `${comm.senderRole}: ${comm.preview}`}
          </span>
          <span className="text-slate-400 text-xs">
            {comm.createdAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import {
  MessageSquare,
  Mail,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Edit2,
  Check,
  AlertTriangle,
  Send,
  FileCheck,
  MoreVertical,
  Copy,
  Share2,
  Flag,
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { TimelineItem } from "@/lib/communications/unified-timeline.service";

interface UnifiedTimelineProps {
  items: TimelineItem[];
  loading?: boolean;
  onItemAction?: (itemId: string, action: "pin" | "reply" | "edit" | "delete") => void;
}

/**
 * Unified timeline component
 * Displays all communication types in chronological order with rich context
 */
export function UnifiedTimeline({
  items,
  loading = false,
  onItemAction,
}: UnifiedTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Group items by date
  const groupedItems = useMemo(() => {
    const groups: Record<string, TimelineItem[]> = {};

    items.forEach(item => {
      const date = item.timestamp;
      let dateKey: string;

      if (isToday(date)) {
        dateKey = "Today";
      } else if (isYesterday(date)) {
        dateKey = "Yesterday";
      } else {
        dateKey = format(date, "EEEE, MMMM d");
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    return groups;
  }, [items]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-full bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-slate-100 rounded" />
                <div className="h-3 w-1/2 bg-slate-50 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="h-12 w-12 text-slate-300 mb-3" />
        <h3 className="text-sm font-medium text-slate-600">No Activity Yet</h3>
        <p className="text-xs text-slate-500 mt-1">
          Activity will appear here as messages, emails, and documents are shared
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedItems).map(([dateKey, dateItems]) => (
        <div key={dateKey}>
          {/* Date separator */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs font-semibold text-slate-500 uppercase">
                {dateKey}
              </span>
            </div>
          </div>

          {/* Timeline items for date */}
          <div className="space-y-3">
            {dateItems.map((item, index) => (
              <TimelineItemCard
                key={item.id}
                item={item}
                isExpanded={expandedId === item.id}
                isSelected={selectedId === item.id}
                onToggleExpand={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
                onSelect={() => setSelectedId(item.id)}
                onAction={(action) => onItemAction?.(item.id, action)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface TimelineItemCardProps {
  item: TimelineItem;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
  onAction: (action: "pin" | "reply" | "edit" | "delete") => void;
}

/**
 * Individual timeline item card with type-specific rendering
 */
function TimelineItemCard({
  item,
  isExpanded,
  isSelected,
  onToggleExpand,
  onSelect,
  onAction,
}: TimelineItemCardProps) {
  const config = getTimelineItemConfig(item.type);

  return (
    <div
      className={`rounded-lg border p-4 transition-all cursor-pointer ${
        isSelected
          ? "border-brand bg-brand/5"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
      onClick={onSelect}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${config.bgColor}`}
        >
          <config.icon className={`h-5 w-5 ${config.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-slate-900">
                  {item.actor.name || item.actor.email}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.badgeBg} ${config.badgeColor}`}>
                  {config.label}
                </span>
                {item.actor.role !== "applicant" && (
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded capitalize">
                    {item.actor.role}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {format(item.timestamp, "h:mm a")}
                {item.edited && (
                  <span className="ml-2 italic">
                    Edited {formatDistanceToNow(item.editedAt || new Date(), { addSuffix: true })}
                  </span>
                )}
              </p>
            </div>

            {/* Delivery status for emails */}
            {item.deliveryStatus && (
              <DeliveryStatusBadge status={item.deliveryStatus} />
            )}

            {/* More actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Message content */}
          <div className="mt-2">
            <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">
              {item.content}
            </p>
          </div>

          {/* Status badge for reads */}
          {item.read === false && (
            <div className="mt-2 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-brand" />
              <span className="text-xs font-medium text-brand">Unread</span>
            </div>
          )}

          {/* Expanded actions */}
          {isExpanded && (
            <div className="mt-3 flex gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => onAction("reply")}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded transition"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Reply
              </button>
              {item.type === "internal_message" && (
                <button
                  onClick={() => onAction("edit")}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded transition"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}
              <button
                onClick={() => onAction("pin")}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded transition"
              >
                <Flag className="h-3.5 w-3.5" />
                Pin
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(item.content);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded transition"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Delivery status badge for emails
 */
function DeliveryStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { icon: any; color: string; bg: string }> = {
    sending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    delivered: { icon: Check, color: "text-success", bg: "bg-success/10" },
    failed: { icon: AlertTriangle, color: "text-error", bg: "bg-error/10" },
    pending: { icon: Clock, color: "text-slate-600", bg: "bg-slate-50" },
  };

  const config = configs[status] || configs.pending;

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.color}`}>
      <config.icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  );
}

/**
 * Get styling config for timeline item type
 */
function getTimelineItemConfig(type: string) {
  const configs: Record<string, any> = {
    internal_message: {
      icon: MessageSquare,
      color: "text-brand",
      bgColor: "bg-brand/10",
      badgeColor: "text-brand",
      badgeBg: "bg-brand/10",
      label: "Message",
    },
    email_sent: {
      icon: Send,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      badgeColor: "text-blue-600",
      badgeBg: "bg-blue-50",
      label: "Email",
    },
    email_received: {
      icon: Mail,
      color: "text-green-600",
      bgColor: "bg-green-50",
      badgeColor: "text-green-600",
      badgeBg: "bg-green-50",
      label: "Email Received",
    },
    document_request: {
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      badgeColor: "text-orange-600",
      badgeBg: "bg-orange-50",
      label: "Document Requested",
    },
    document_uploaded: {
      icon: FileCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      badgeColor: "text-green-600",
      badgeBg: "bg-green-50",
      label: "Document Uploaded",
    },
    staff_note: {
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      badgeColor: "text-purple-600",
      badgeBg: "bg-purple-50",
      label: "Staff Note",
    },
    decision: {
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10",
      badgeColor: "text-success",
      badgeBg: "bg-success/10",
      label: "Decision",
    },
    status_change: {
      icon: AlertCircle,
      color: "text-slate-600",
      bgColor: "bg-slate-100",
      badgeColor: "text-slate-600",
      badgeBg: "bg-slate-100",
      label: "Status Changed",
    },
    application_submitted: {
      icon: CheckCircle,
      color: "text-brand",
      bgColor: "bg-brand/10",
      badgeColor: "text-brand",
      badgeBg: "bg-brand/10",
      label: "Application Submitted",
    },
  };

  return configs[type] || configs.internal_message;
}

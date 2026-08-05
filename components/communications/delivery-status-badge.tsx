"use client";

import React from "react";
import {
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  XCircle,
  Archive,
  Eye,
  Mail
} from "lucide-react";
import type { NotificationDeliveryStatus } from "@/lib/notifications/communication-types";

export interface DeliveryStatusBadgeProps {
  status: NotificationDeliveryStatus | "READ" | "SENDING";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showIcon?: boolean;
  className?: string;
  tooltip?: boolean;
}

/**
 * Delivery Status Badge
 * Reusable badge showing delivery status with consistent styling
 * Used across Timeline, Conversations, Dashboard, Composer
 */
export function DeliveryStatusBadge({
  status,
  size = "md",
  showLabel = true,
  showIcon = true,
  className = "",
  tooltip = true
}: DeliveryStatusBadgeProps) {
  const config = getStatusConfig(status);

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  const badge = (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-colors ${sizeClasses[size]} ${config.bgColor} ${config.textColor} ${className}`}
      title={tooltip ? config.title : undefined}
    >
      {showIcon && config.icon}
      {showLabel && config.label}
    </div>
  );

  return badge;
}

/**
 * Status configuration with colors, icons, and labels
 */
function getStatusConfig(status: NotificationDeliveryStatus | "READ" | "SENDING") {
  const configs: Record<string, any> = {
    // Pending/In-flight
    PENDING: {
      label: "Pending",
      icon: <Clock className="w-4 h-4" />,
      bgColor: "bg-gray-100",
      textColor: "text-gray-700",
      title: "Waiting to be sent"
    },
    QUEUED: {
      label: "Queued",
      icon: <Clock className="w-4 h-4" />,
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
      title: "In queue for delivery"
    },
    SENDING: {
      label: "Sending...",
      icon: <RefreshCw className="w-4 h-4 animate-spin" />,
      bgColor: "bg-cyan-100",
      textColor: "text-cyan-700",
      title: "Currently being sent"
    },

    // Success
    SENT: {
      label: "Sent",
      icon: <Send className="w-4 h-4" />,
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
      title: "Sent to provider"
    },
    DELIVERED: {
      label: "Delivered",
      icon: <CheckCircle className="w-4 h-4" />,
      bgColor: "bg-green-100",
      textColor: "text-green-700",
      title: "Successfully delivered"
    },
    READ: {
      label: "Read",
      icon: <Eye className="w-4 h-4" />,
      bgColor: "bg-emerald-100",
      textColor: "text-emerald-700",
      title: "Recipient read message"
    },

    // Failure
    FAILED: {
      label: "Failed",
      icon: <AlertCircle className="w-4 h-4" />,
      bgColor: "bg-red-100",
      textColor: "text-red-700",
      title: "Delivery failed"
    },

    // Other
    CANCELLED: {
      label: "Cancelled",
      icon: <XCircle className="w-4 h-4" />,
      bgColor: "bg-gray-100",
      textColor: "text-gray-700",
      title: "Delivery cancelled"
    },

    // Fallback
    ARCHIVED: {
      label: "Archived",
      icon: <Archive className="w-4 h-4" />,
      bgColor: "bg-gray-100",
      textColor: "text-gray-600",
      title: "Archived"
    }
  };

  return configs[status] || configs.PENDING;
}

/**
 * Status indicator dot (minimal version)
 */
export function DeliveryStatusDot({
  status,
  size = "sm",
  className = ""
}: {
  status: NotificationDeliveryStatus | "READ" | "SENDING";
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const config = getStatusConfig(status);

  const sizeClasses = {
    xs: "w-2 h-2",
    sm: "w-3 h-3",
    md: "w-4 h-4"
  };

  const colorMap: Record<string, string> = {
    "bg-gray-100": "bg-gray-400",
    "bg-blue-100": "bg-blue-500",
    "bg-cyan-100": "bg-cyan-500",
    "bg-green-100": "bg-green-500",
    "bg-emerald-100": "bg-emerald-500",
    "bg-red-100": "bg-red-500"
  };

  const dotColor = colorMap[config.bgColor] || "bg-gray-400";

  return (
    <div
      className={`inline-flex rounded-full ${sizeClasses[size]} ${dotColor} ${className}`}
      title={config.title}
    />
  );
}

/**
 * Detailed status card (for modals/expanded view)
 */
export function DeliveryStatusCard({
  status,
  timestamp,
  error,
  retryCount,
  maxRetries,
  nextRetryAt
}: {
  status: NotificationDeliveryStatus | "READ" | "SENDING";
  timestamp?: Date;
  error?: string;
  retryCount?: number;
  maxRetries?: number;
  nextRetryAt?: Date;
}) {
  const config = getStatusConfig(status);

  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-3">
      {/* Status row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {config.icon}
          <div>
            <p className="font-medium text-slate-900">{config.label}</p>
            <p className="text-xs text-slate-500">{config.title}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded ${config.bgColor} ${config.textColor}`}>
          {config.label}
        </span>
      </div>

      {/* Timestamp */}
      {timestamp && (
        <div className="text-sm">
          <p className="text-slate-600">
            <span className="font-medium">Timestamp:</span>{" "}
            {timestamp.toLocaleString()}
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-2">
          <p className="text-sm text-red-700">
            <span className="font-medium">Error:</span> {error}
          </p>
        </div>
      )}

      {/* Retry info */}
      {retryCount !== undefined && maxRetries !== undefined && (
        <div className="text-sm">
          <p className="text-slate-600">
            <span className="font-medium">Attempts:</span>{" "}
            {retryCount} / {maxRetries}
          </p>
          {nextRetryAt && retryCount < maxRetries && (
            <p className="text-slate-600 mt-1">
              <span className="font-medium">Next retry:</span>{" "}
              {nextRetryAt.toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Timeline status indicator with hover details
 */
export function TimelineStatusIndicator({
  status,
  timestamp,
  error
}: {
  status: NotificationDeliveryStatus | "READ" | "SENDING";
  timestamp?: Date;
  error?: string;
}) {
  const config = getStatusConfig(status);
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.bgColor} ${config.textColor} hover:opacity-80 transition-opacity`}
      >
        {config.icon}
        {config.label}
      </button>

      {showTooltip && (error || timestamp) && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-xs rounded shadow-lg p-2 whitespace-nowrap">
          {error && <div className="text-red-300">{error}</div>}
          {timestamp && <div>{timestamp.toLocaleTimeString()}</div>}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-transparent border-t-slate-900"></div>
        </div>
      )}
    </div>
  );
}

/**
 * Status progress indicator
 */
export function DeliveryStatusProgress({
  current,
  statuses = ["QUEUED", "SENT", "DELIVERED"]
}: {
  current: NotificationDeliveryStatus | "READ" | "SENDING";
  statuses?: Array<NotificationDeliveryStatus | "READ" | "SENDING">;
}) {
  const currentIndex = statuses.indexOf(current);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {statuses.map((s, i) => (
          <React.Fragment key={s}>
            <div
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= currentIndex ? "bg-green-500" : "bg-slate-200"
              }`}
            />
          </React.Fragment>
        ))}
      </div>
      <div className="flex justify-between text-xs">
        {statuses.map(s => (
          <span
            key={s}
            className={`font-medium ${
              statuses.indexOf(s) <= currentIndex
                ? "text-green-600"
                : "text-slate-400"
            }`}
          >
            {getStatusConfig(s).label}
          </span>
        ))}
      </div>
    </div>
  );
}

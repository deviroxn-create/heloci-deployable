"use client";

import { useState, useRef, useEffect } from "react";
import {
  MoreVertical, Reply, Copy, Forward, Download, Eye, Trash2,
  CheckCircle, AlertCircle, Clock
} from "lucide-react";
import { TimelineItem, TimelineAction, ActionResponse } from "./ConversationWorkspace.types";

interface TimelineActionsProps {
  item: TimelineItem;
  onAction: (action: TimelineAction, payload?: any) => Promise<ActionResponse>;
  onReply?: (item: TimelineItem) => void;
  compact?: boolean;
  readOnly?: boolean;
}

/**
 * Timeline Actions Menu
 *
 * Provides action buttons for timeline items:
 * - Reply
 * - Copy text
 * - Forward
 * - Download attachments
 * - Mark unread
 * - Jump to application
 * - View details
 *
 * Features:
 * - Dropdown menu for secondary actions
 * - Loading states
 * - Error handling
 * - Accessibility support
 */
export function TimelineActions({
  item,
  onAction,
  onReply,
  compact = false,
  readOnly = false,
}: TimelineActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<TimelineAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = async (action: TimelineAction) => {
    setActionLoading(action);
    setActionError(null);

    try {
      if (action === "reply") {
        if (onReply) {
          onReply(item);
          setMenuOpen(false);
        }
      } else if (action === "copy") {
        await navigator.clipboard.writeText(item.content || "");
        setMenuOpen(false);
      } else {
        const response = await onAction(action, { itemId: item.id });

        if (!response.success) {
          setActionError(response.error || "Action failed");
        } else {
          setMenuOpen(false);
        }
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setActionLoading(null);
    }
  };

  const isSystemMessage = item.type === "system_event" || item.type === "announcement";
  const canReply = !readOnly && !isSystemMessage;
  const hasAttachments = item.attachments && item.attachments.length > 0;

  if (compact) {
    // Minimal inline actions for compact view
    return (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        {canReply && (
          <button
            onClick={() => handleAction("reply")}
            className="p-1.5 hover:bg-slate-200 rounded transition"
            aria-label="Reply"
            title="Reply"
            disabled={actionLoading === "reply"}
          >
            <Reply className="h-4 w-4 text-slate-600" />
          </button>
        )}

        <button
          onClick={() => handleAction("copy")}
          className="p-1.5 hover:bg-slate-200 rounded transition"
          aria-label="Copy message"
          title="Copy"
          disabled={actionLoading === "copy"}
        >
          <Copy className="h-4 w-4 text-slate-600" />
        </button>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1.5 hover:bg-slate-200 rounded transition relative"
          aria-label="More actions"
          title="More options"
        >
          <MoreVertical className="h-4 w-4 text-slate-600" />
          {menuOpen && <ActionsDropdown item={item} onAction={handleAction} />}
        </button>
      </div>
    );
  }

  // Full action menu
  return (
    <div className="relative" ref={menuRef}>
      {/* Primary actions */}
      <div className="flex items-center gap-2">
        {canReply && (
          <button
            onClick={() => handleAction("reply")}
            className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition flex items-center gap-1"
            disabled={actionLoading === "reply"}
            aria-label="Reply to message"
          >
            <Reply className="h-4 w-4" />
            {!actionLoading && <span>Reply</span>}
            {actionLoading === "reply" && <Spinner className="h-4 w-4" />}
          </button>
        )}

        <button
          onClick={() => handleAction("copy")}
          className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition flex items-center gap-1"
          disabled={actionLoading === "copy"}
          aria-label="Copy message text"
        >
          <Copy className="h-4 w-4" />
          {!actionLoading && <span>Copy</span>}
          {actionLoading === "copy" && <Spinner className="h-4 w-4" />}
        </button>

        {hasAttachments && (
          <button
            onClick={() => handleAction("download_attachment")}
            className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition flex items-center gap-1"
            disabled={actionLoading === "download_attachment"}
            aria-label="Download attachments"
          >
            <Download className="h-4 w-4" />
            {!actionLoading && <span>Download</span>}
            {actionLoading === "download_attachment" && <Spinner className="h-4 w-4" />}
          </button>
        )}

        {/* More menu */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
          aria-label="More actions"
          aria-expanded={menuOpen}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Dropdown menu */}
      {menuOpen && (
        <ActionsDropdown
          item={item}
          onAction={handleAction}
          actionLoading={actionLoading}
        />
      )}

      {/* Error message */}
      {actionError && (
        <div className="absolute top-full mt-2 right-0 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 max-w-xs z-50">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Action failed</p>
              <p className="text-xs mt-1">{actionError}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Actions Dropdown Menu
 */
interface ActionsDropdownProps {
  item: TimelineItem;
  onAction: (action: TimelineAction) => void;
  actionLoading?: TimelineAction | null;
}

function ActionsDropdown({ item, onAction, actionLoading }: ActionsDropdownProps) {
  const isSystemMessage = item.type === "system_event" || item.type === "announcement";
  const hasAttachments = item.attachments && item.attachments.length > 0;

  const actions: Array<{
    label: string;
    action: TimelineAction;
    icon: React.ReactNode;
    show: boolean;
  }> = [
    {
      label: "Forward",
      action: "forward",
      icon: <Forward className="h-4 w-4" />,
      show: !isSystemMessage,
    },
    {
      label: "Mark Unread",
      action: "mark_unread",
      icon: <Eye className="h-4 w-4" />,
      show: true,
    },
    {
      label: "Jump to Application",
      action: "jump_to_application",
      icon: <CheckCircle className="h-4 w-4" />,
      show: true,
    },
  ];

  return (
    <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-48 overflow-hidden">
      {actions
        .filter((a) => a.show)
        .map((action) => (
          <button
            key={action.action}
            onClick={() => {
              onAction(action.action);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition disabled:opacity-50"
            disabled={actionLoading === action.action}
          >
            <span className="flex-shrink-0 text-slate-400">{action.icon}</span>
            <span className="flex-1 text-left">{action.label}</span>
            {actionLoading === action.action && <Spinner className="h-4 w-4" />}
          </button>
        ))}

      {/* Divider */}
      {!isSystemMessage && <div className="h-px bg-slate-100" />}

      {/* Delete action (if not read-only and not system) */}
      {!isSystemMessage && (
        <button
          onClick={() => onAction("forward")}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete (future)</span>
        </button>
      )}
    </div>
  );
}

/**
 * Inline Action Response
 * Shows result of an action (success, error, loading)
 */
interface InlineActionResponseProps {
  status: "success" | "error" | "loading" | null;
  message?: string;
  onClose?: () => void;
}

export function InlineActionResponse({
  status,
  message,
  onClose,
}: InlineActionResponseProps) {
  if (!status) return null;

  const colors = {
    success: "bg-green-50 border-green-200 text-green-700",
    error: "bg-red-50 border-red-200 text-red-700",
    loading: "bg-blue-50 border-blue-200 text-blue-700",
  };

  const icons = {
    success: <CheckCircle className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />,
    loading: <Spinner className="h-4 w-4" />,
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colors[status]}`}
      role="status"
      aria-label={message}
    >
      {icons[status]}
      <span className="text-sm font-medium flex-1">{message || `${status}...`}</span>
      {onClose && status !== "loading" && (
        <button onClick={onClose} className="ml-auto">
          <span className="sr-only">Close</span>×
        </button>
      )}
    </div>
  );
}

/**
 * Loading spinner
 */
function Spinner({ className }: { className: string }) {
  return (
    <svg
      className={`${className} animate-spin`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

"use client";

import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  AlertCircle,
  FileText,
  ChevronRight,
} from "lucide-react";

interface ConversationPreviewCardProps {
  applicationId: string;
  applicantName: string | null;
  applicantEmail: string;
  programName: string;
  currentStatus: string;
  assignedStaff: string | null;
  lastMessage: string | null;
  unreadCount: number;
  lastActivityAt: Date;
  onClick?: () => void;
}

/**
 * Rich conversation preview card
 * Shows applicant info, program, status, last message, unread badge
 */
export function ConversationPreviewCard({
  applicationId,
  applicantName,
  applicantEmail,
  programName,
  currentStatus,
  assignedStaff,
  lastMessage,
  unreadCount,
  lastActivityAt,
  onClick,
}: ConversationPreviewCardProps) {
  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    approved: { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
    rejected: { bg: "bg-error/10", text: "text-error", dot: "bg-error" },
    more_info_requested: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      dot: "bg-orange-500",
    },
    under_review: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    waitlisted: { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-500" },
  };

  const statusConfig = statusColors[currentStatus] || statusColors.pending;
  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm transition-all"
    >
      <div className="flex gap-3">
        {/* Avatar & Status Dot */}
        <div className="relative flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand to-brand/60 flex items-center justify-center text-white font-semibold text-sm">
            {applicantName?.charAt(0)?.toUpperCase() || applicantEmail.charAt(0).toUpperCase()}
          </div>
          <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${statusConfig.dot}`} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header: Name & Unread Badge */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="font-medium text-sm text-slate-900 truncate">
                {applicantName || applicantEmail.split("@")[0]}
              </p>
              <p className="text-xs text-slate-500 truncate">{applicantEmail}</p>
            </div>
            {hasUnread && (
              <div className="flex-shrink-0 px-2 py-0.5 bg-brand rounded-full min-w-fit">
                <span className="text-xs font-semibold text-white">{unreadCount}</span>
              </div>
            )}
          </div>

          {/* Program & Status Row */}
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs text-slate-600 truncate">{programName}</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${statusConfig.bg} ${statusConfig.text}`}>
              {currentStatus.replace("_", " ")}
            </span>
          </div>

          {/* Last Message Preview */}
          {lastMessage && (
            <p className="text-sm text-slate-600 line-clamp-1 mb-2">
              {lastMessage}
            </p>
          )}

          {/* Footer: Staff & Time */}
          <div className="flex items-center justify-between">
            {assignedStaff && (
              <p className="text-xs text-slate-500">
                Assigned to <span className="font-medium">{assignedStaff}</span>
              </p>
            )}
            <p className="text-xs text-slate-500 whitespace-nowrap">
              {formatDistanceToNow(new Date(lastActivityAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Chevron */}
        <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

interface ConversationListProps {
  conversations: any[];
  selectedId?: string;
  onSelect?: (conversationId: string) => void;
  loading?: boolean;
  emptyMessage?: string;
}

/**
 * Conversation list container with loading and empty states
 */
export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  loading = false,
  emptyMessage = "No conversations yet",
}: ConversationListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex-shrink-0" />
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

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="h-12 w-12 text-slate-300 mb-3" />
        <p className="text-sm font-medium text-slate-600">{emptyMessage}</p>
        <p className="text-xs text-slate-500 mt-1">
          Conversations will appear here as applications progress
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map(conversation => (
        <div
          key={conversation.applicationId}
          className={`rounded-lg border transition-all ${
            selectedId === conversation.applicationId
              ? "border-brand bg-brand/5"
              : "border-slate-200"
          }`}
        >
          <ConversationPreviewCard
            applicationId={conversation.applicationId}
            applicantName={conversation.applicantName}
            applicantEmail={conversation.applicantEmail}
            programName={conversation.programName}
            currentStatus={conversation.status}
            assignedStaff={conversation.assignedTo}
            lastMessage={conversation.lastMessagePreview}
            unreadCount={conversation.unreadCount}
            lastActivityAt={new Date(conversation.lastActivityAt)}
            onClick={() => onSelect?.(conversation.applicationId)}
          />
        </div>
      ))}
    </div>
  );
}

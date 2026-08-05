"use client";

import { useState } from "react";
import {
  MessageCircle,
  HelpCircle,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Zap,
  Lock,
  Download,
  Eye,
  Pin,
  MoreVertical,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MessageProps {
  id: string;
  type: "normal" | "information" | "question" | "document_request" | "status_update" | "approval" | "rejection" | "system" | "internal_note";
  senderName: string;
  senderRole: "applicant" | "staff" | "admin" | "system";
  content: string;
  timestamp: Date;
  read?: boolean;
  attachments?: Array<{ id: string; fileName: string; fileUrl: string }>;
  isPinned?: boolean;
  replyCount?: number;
  onReply?: () => void;
  onPin?: () => void;
}

const MESSAGE_TYPE_CONFIG: Record<string, { icon: any; color: string; bgColor: string; title: string }> = {
  normal: {
    icon: MessageCircle,
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    title: "Message",
  },
  information: {
    icon: AlertCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    title: "Information",
  },
  question: {
    icon: HelpCircle,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    title: "Question",
  },
  document_request: {
    icon: FileText,
    color: "text-red-600",
    bgColor: "bg-red-50",
    title: "Document Request",
  },
  status_update: {
    icon: Clock,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    title: "Status Update",
  },
  approval: {
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-50",
    title: "Approved",
  },
  rejection: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    title: "Rejection",
  },
  system: {
    icon: Zap,
    color: "text-slate-500",
    bgColor: "bg-slate-100",
    title: "System",
  },
  internal_note: {
    icon: Lock,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    title: "Internal Note",
  },
};

export function MessageDisplay({
  id,
  type,
  senderName,
  senderRole,
  content,
  timestamp,
  read,
  attachments,
  isPinned,
  replyCount,
  onReply,
  onPin,
}: MessageProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const config = MESSAGE_TYPE_CONFIG[type] || MESSAGE_TYPE_CONFIG.normal;
  const Icon = config.icon;

  const isInternal = type === "internal_note";
  const isSystem = type === "system";

  // Determine role badge color
  const getRoleBadgeColor = () => {
    switch (senderRole) {
      case "staff":
        return "bg-blue-100 text-blue-700";
      case "admin":
        return "bg-purple-100 text-purple-700";
      case "applicant":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div
      className={`group flex gap-4 py-4 px-4 rounded-lg border border-transparent transition-all ${
        isHovering ? "border-border bg-slate-50" : ""
      } ${isPinned ? "border-amber-200 bg-amber-50" : ""}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setShowActions(false);
      }}
    >
      {/* Icon & Color Bar */}
      <div className={`flex-shrink-0 w-1 rounded-full ${config.bgColor}`} />

      {/* Message Header & Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${config.color} flex-shrink-0`} />
            <span className="font-semibold text-sm text-slate-900">
              {senderName}
            </span>
          </div>

          {/* Role Badge */}
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded ${getRoleBadgeColor()}`}
          >
            {senderRole}
          </span>

          {/* Type Badge */}
          {type !== "normal" && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.bgColor} ${config.color}`}>
              {config.title}
            </span>
          )}

          {/* Internal Indicator */}
          {isInternal && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-700 flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Staff Only
            </span>
          )}

          {/* Pinned Indicator */}
          {isPinned && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-700 flex items-center gap-1">
              <Pin className="h-3 w-3" />
              Pinned
            </span>
          )}

          <span className="text-xs text-slate-500 ml-auto">
            {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
          </span>

          {!read && !isSystem && (
            <div className="h-2 w-2 rounded-full bg-brand flex-shrink-0" title="Unread" />
          )}
        </div>

        {/* Content */}
        <div
          className={`text-sm leading-relaxed ${
            isSystem ? "text-slate-600 italic" : "text-slate-900"
          } prose prose-sm max-w-none`}
        >
          {content}
        </div>

        {/* Attachments */}
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.fileUrl}
                download
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 hover:bg-slate-200 transition text-sm text-slate-700"
              >
                <FileText className="h-4 w-4" />
                {attachment.fileName}
                <Download className="h-3 w-3 text-slate-500" />
              </a>
            ))}
          </div>
        )}

        {/* Actions */}
        {isHovering && !isSystem && (
          <div className="flex gap-2 mt-3 text-slate-500">
            {onReply && (
              <button
                onClick={onReply}
                className="text-xs font-medium hover:text-slate-700 transition flex items-center gap-1"
              >
                <MessageCircle className="h-3 w-3" />
                Reply {replyCount && replyCount > 0 ? `(${replyCount})` : ""}
              </button>
            )}
            {onPin && (
              <button
                onClick={onPin}
                className="text-xs font-medium hover:text-slate-700 transition flex items-center gap-1"
              >
                <Pin className="h-3 w-3" />
                {isPinned ? "Unpin" : "Pin"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* More Actions Menu */}
      {isHovering && (
        <div className="flex-shrink-0">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 rounded hover:bg-slate-200 transition"
          >
            <MoreVertical className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      )}
    </div>
  );
}

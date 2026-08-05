"use client";

import { Mail, MessageSquare, Search, FileText, Inbox, PenTool } from "lucide-react";

interface EmptyStateProps {
  type:
    | "no_drafts"
    | "no_messages"
    | "no_search_results"
    | "no_conversations"
    | "no_templates"
    | "no_sent_emails"
    | "empty_inbox";
  searchQuery?: string;
  onAction?: () => void;
}

/**
 * Friendly empty states for communication interfaces
 */
export function CommunicationEmptyState({
  type,
  searchQuery,
  onAction,
}: EmptyStateProps) {
  const states = {
    no_drafts: {
      icon: PenTool,
      title: "No Drafts Yet",
      description: "Start writing an email to save it as a draft",
      action: "Compose Email",
    },
    no_messages: {
      icon: MessageSquare,
      title: "No Messages",
      description: "Your inbox is empty. Messages will appear here.",
      action: null,
    },
    no_search_results: {
      icon: Search,
      title: "No Results Found",
      description: `No conversations match "${searchQuery || ""}"`,
      action: "Clear Search",
    },
    no_conversations: {
      icon: MessageSquare,
      title: "No Conversations",
      description: "As applications progress, conversations will appear here",
      action: null,
    },
    no_templates: {
      icon: FileText,
      title: "No Templates",
      description: "Create message templates to speed up communication",
      action: "Create Template",
    },
    no_sent_emails: {
      icon: Mail,
      title: "No Sent Emails",
      description: "Emails you send will appear here",
      action: null,
    },
    empty_inbox: {
      icon: Inbox,
      title: "Inbox Empty",
      description: "All caught up! No new messages.",
      action: null,
    },
  };

  const state = states[type];
  const Icon = state.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-100">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">
        {state.title}
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mb-4">
        {state.description}
      </p>
      {state.action && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand/90 transition"
        >
          {state.action}
        </button>
      )}
    </div>
  );
}

/**
 * Loading skeleton for timeline
 */
export function TimelineLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="animate-pulse">
          {/* Date separator */}
          {i === 1 && (
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <div className="h-4 w-20 bg-slate-100 rounded" />
              </div>
            </div>
          )}

          {/* Timeline item */}
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-slate-100 rounded" />
              <div className="h-3 w-1/2 bg-slate-50 rounded" />
              <div className="h-12 w-full bg-slate-50 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for message list
 */
export function MessageListLoadingSkeleton() {
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

/**
 * Loading skeleton for draft list
 */
export function DraftListLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="animate-pulse flex gap-4 p-4 border border-slate-200 rounded-lg"
        >
          <div className="h-10 w-10 rounded bg-slate-100 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 bg-slate-100 rounded" />
            <div className="h-3 w-1/2 bg-slate-50 rounded" />
            <div className="h-3 w-40 bg-slate-50 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded bg-slate-100" />
            <div className="h-8 w-8 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for conversation list
 */
export function ConversationListLoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="animate-pulse">
          <div className="flex gap-3 p-4 border border-slate-200 rounded-lg">
            <div className="relative flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-slate-100" />
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-slate-200" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-slate-100 rounded" />
              <div className="h-3 w-1/2 bg-slate-50 rounded" />
              <div className="h-3 w-full bg-slate-50 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for recipient picker
 */
export function RecipientPickerLoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded">
          <div className="h-8 w-8 rounded-full bg-slate-100 flex-shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-1/2 bg-slate-100 rounded" />
            <div className="h-2 w-3/4 bg-slate-50 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import {
  MessageSquare,
  Filter,
  Search,
  Download,
  Clock,
  AlertCircle,
  FileText,
  Archive,
  MoreVertical,
} from "lucide-react";
import { MessageDisplay } from "./message-display";
import { MessageComposer } from "./message-composer";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface CommunicationCenterProps {
  applicationId: string;
  organizationId: string;
  userRole: "applicant" | "staff" | "admin";
  userId: string;
}

interface TimelineItem {
  id: string;
  type: "message" | "event" | "document" | "status_change";
  timestamp: Date;
  content?: string;
  senderName?: string;
  senderRole?: "staff" | "applicant" | "admin";
  messageType?: string;
  eventType?: string;
  metadata?: any;
}

export function CommunicationCenter({
  applicationId,
  organizationId,
  userRole,
  userId,
}: CommunicationCenterProps) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "documents" | "system">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation on mount
  useEffect(() => {
    loadConversation();
  }, [applicationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/communications/conversation?applicationId=${applicationId}&organizationId=${organizationId}`
      );

      if (!response.ok) throw new Error("Failed to load conversation");

      const data = await response.json();
      setTimeline(data.timeline || []);

      // Mark as read
      await fetch("/api/communications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, organizationId }),
      }).catch(() => {});
    } catch (error) {
      console.error("Error loading conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string, attachments?: string[]) => {
    if (!content.trim()) return;

    try {
      setSending(true);
      const response = await fetch("/api/communications/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          organizationId,
          content,
          attachments,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      // Reload conversation
      await loadConversation();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleRequestDocuments = async () => {
    // This will be triggered from a modal/form
    // For now, placeholder
    console.log("Request documents action");
  };

  // Filter timeline
  let filteredTimeline = timeline;

  if (searchTerm) {
    filteredTimeline = filteredTimeline.filter(
      (item) =>
        item.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.senderName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (activeFilter === "unread") {
    filteredTimeline = filteredTimeline.filter((item) => item.type === "message" && !item.metadata?.read);
  } else if (activeFilter === "documents") {
    filteredTimeline = filteredTimeline.filter((item) => item.type === "document");
  } else if (activeFilter === "system") {
    filteredTimeline = filteredTimeline.filter((item) => item.type === "event");
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-border">
      {/* Header */}
      <div className="border-b border-border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold text-slate-900">
              Case Communication Center
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {userRole !== "applicant" && (
              <>
                <Button variant="outline" size="sm" onClick={handleRequestDocuments}>
                  <FileText className="h-4 w-4 mr-2" />
                  Request Documents
                </Button>
                <button className="p-2 rounded-lg hover:bg-slate-100 transition">
                  <Download className="h-4 w-4 text-slate-600" />
                </button>
                <button className="p-2 rounded-lg hover:bg-slate-100 transition">
                  <MoreVertical className="h-4 w-4 text-slate-600" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm"
            />
          </div>

          <div className="flex gap-2">
            {(["all", "unread", "documents", "system"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  activeFilter === filter
                    ? "bg-brand text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {filter === "all"
                  ? "All"
                  : filter === "unread"
                    ? "Unread"
                    : filter === "documents"
                      ? "Documents"
                      : "System"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline/Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Loading conversation...</p>
            </div>
          </div>
        ) : filteredTimeline.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm mt-1">Start the conversation</p>
            </div>
          </div>
        ) : (
          <>
            {filteredTimeline.map((item) => {
              if (item.type === "message") {
                // Don't show internal notes to applicants
                if (item.messageType === "internal_note" && userRole === "applicant") {
                  return null;
                }

                return (
                  <MessageDisplay
                    key={item.id}
                    id={item.id}
                    type={(item.messageType || "normal") as any}
                    senderName={item.senderName || "Unknown"}
                    senderRole={item.senderRole || "applicant"}
                    content={item.content || ""}
                    timestamp={new Date(item.timestamp)}
                    read={item.metadata?.read}
                    attachments={item.metadata?.attachments}
                    replyCount={item.metadata?.replyCount}
                  />
                );
              }

              if (item.type === "event") {
                return (
                  <div key={item.id} className="flex gap-4 py-3 px-4 rounded-lg bg-slate-50 border border-border">
                    <AlertCircle className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {item.eventType === "status_changed"
                          ? `Status updated to ${item.metadata?.toStatus}`
                          : item.eventType === "documents_requested"
                            ? `${item.metadata?.documentCount} document(s) requested`
                            : item.eventType}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDistanceToNow(new Date(item.timestamp), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                );
              }

              if (item.type === "document") {
                return (
                  <div key={item.id} className="flex gap-4 py-3 px-4 rounded-lg bg-blue-50 border border-blue-200">
                    <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {item.metadata?.fileName}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Status: {item.metadata?.status}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDistanceToNow(new Date(item.timestamp), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                );
              }

              return null;
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Composer */}
      {userRole !== "applicant" || userRole === "applicant" ? (
        <MessageComposer
          applicationId={applicationId}
          onSendMessage={handleSendMessage}
          isLoading={sending}
        />
      ) : null}
    </div>
  );
}

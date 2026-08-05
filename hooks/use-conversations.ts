"use client";

import { useEffect, useState, useCallback } from "react";

export interface Conversation {
  applicationId: string;
  conversationId: string;
  applicantName: string;
  applicantEmail: string;
  programName: string;
  organizationId?: string;
  status: string;
  assignedTo?: string;
  messageCount: number;
  unreadCount: number;
  lastActivityAt: string;
  lastMessagePreview: string;
}

interface UseConversationsOptions {
  organizationId?: string;
  view?: "staff" | "applicant";
  pageSize?: number;
  unreadOnly?: boolean;
}

/**
 * Hook to fetch and manage conversations list
 * Supports staff, applicant, and admin views
 * 
 * Usage:
 * const { conversations, isLoading, error, refetch } = useConversations({
 *   organizationId: "org-123",
 *   view: "staff"
 * });
 */
export function useConversations(options: UseConversationsOptions = {}) {
  const {
    organizationId,
    view = "staff",
    pageSize = 50,
    unreadOnly = false
  } = options;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchConversations = useCallback(async (pageNum = 1) => {
    try {
      setError(null);
      setIsLoading(true);

      const url = new URL("/api/communications", window.location.origin);
      url.searchParams.set("view", view);
      url.searchParams.set("pageSize", pageSize.toString());
      url.searchParams.set("page", pageNum.toString());
      
      if (organizationId) {
        url.searchParams.set("organizationId", organizationId);
      }
      
      if (unreadOnly) {
        url.searchParams.set("unreadOnly", "true");
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Failed to fetch conversations");

      const result = await response.json();
      const data = result.data || {};
      
      setConversations(data.conversations || []);
      setTotal(data.total || 0);
      setPage(pageNum);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("[useConversations] Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, view, pageSize, unreadOnly]);

  // Initial fetch
  useEffect(() => {
    void fetchConversations(1);
  }, [fetchConversations]);

  const loadMore = useCallback(() => {
    void fetchConversations(page + 1);
  }, [page, fetchConversations]);

  return {
    conversations,
    isLoading,
    error,
    refetch: () => fetchConversations(1),
    loadMore,
    page,
    total,
    hasMore: page * pageSize < total
  };
}

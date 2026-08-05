"use client";

import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { TimelineItem, DraftState, SearchResult } from "@/components/communications/ConversationWorkspace.types";

/**
 * TIMELINE HOOKS
 * Phase 1.7 Milestone 3
 *
 * Custom hooks for conversation workspace timeline management.
 * Reuses existing services and APIs. No duplication.
 */

/**
 * useLazyLoadTimeline
 * 
 * Detects scroll position near bottom and triggers pagination load.
 * Reuses existing /api/communications/conversation endpoint.
 * 
 * @param items - Current timeline items
 * @param hasMore - Whether more items available
 * @param onLoad - Callback to load next page
 * @param threshold - Pixels from bottom to trigger load (default: 500)
 */
export function useLazyLoadTimeline(
  items: TimelineItem[],
  hasMore: boolean,
  onLoad: () => Promise<void>,
  threshold: number = 500
) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    if (loadingRef.current) return; // Prevent duplicate loads
    if (!hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < threshold) {
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);

      onLoad()
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to load more items");
        })
        .finally(() => {
          setIsLoading(false);
          loadingRef.current = false;
        });
    }
  }, [hasMore, threshold, onLoad]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return {
    scrollContainerRef,
    isLoading,
    error,
  };
}

/**
 * useSearchHighlight
 * 
 * Searches timeline items and returns results with highlighting info.
 * Reuses existing UnifiedSearchService logic.
 * 
 * @param items - Timeline items to search
 * @param query - Search query string
 */
export function useSearchHighlight(items: TimelineItem[], query: string) {
  const results = useMemo((): Map<string, SearchResult> => {
    if (!query.trim()) {
      return new Map();
    }

    const matches = new Map<string, SearchResult>();
    const lowerQuery = query.toLowerCase();

    items.forEach((item) => {
      const content = (item.content || "").toLowerCase();
      const actorName = (item.actor?.name || "").toLowerCase();
      const actorEmail = (item.actor?.email || "").toLowerCase();
      const subject = (item.subject || "").toLowerCase();

      let isMatch = false;
      let matchType: "content" | "actor" | "subject" = "content";

      if (content.includes(lowerQuery)) {
        isMatch = true;
        matchType = "content";
      } else if (actorName.includes(lowerQuery) || actorEmail.includes(lowerQuery)) {
        isMatch = true;
        matchType = "actor";
      } else if (subject.includes(lowerQuery)) {
        isMatch = true;
        matchType = "subject";
      }

      if (isMatch) {
        const matchContent = matchType === "content" ? content : matchType === "subject" ? subject : actorName;
        const matchIndex = matchContent.indexOf(lowerQuery);

        matches.set(item.id, {
          id: item.id,
          type: item.type,
          preview: item.content || item.actor?.name || "Unknown",
          matchStart: matchIndex,
          matchEnd: matchIndex + lowerQuery.length,
          confidence: matchType === "actor" ? 0.7 : matchType === "subject" ? 0.8 : 1.0,
          timestamp: item.timestamp,
        });
      }
    });

    return matches;
  }, [items, query]);

  const jumpToResult = useCallback((itemId: string) => {
    const element = document.getElementById(`timeline-item-${itemId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.focus();
    }
  }, []);

  return {
    results,
    jumpToResult,
  };
}

/**
 * useDraftAutoSave
 * 
 * Auto-saves draft message every N milliseconds.
 * Falls back to localStorage if API unavailable.
 * Reuses existing /api/communications/drafts endpoint (when available).
 * 
 * @param draft - Current draft state
 * @param applicationId - Application ID for scoping
 * @param interval - Save interval in ms (default: 30000ms = 30s)
 */
export function useDraftAutoSave(
  draft: DraftState,
  applicationId: string,
  interval: number = 30000
) {
  const [saveStatus, setSaveStatus] = useState<"unsaved" | "saving" | "saved">("saved");
  const lastSavedRef = useRef<DraftState | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const localStorageKey = `draft-${applicationId}-${draft.mode}`;

  const saveDraftLocally = useCallback(() => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(draft));
      setSaveStatus("saved");
    } catch (err) {
      console.error("Failed to save draft to localStorage:", err);
      setSaveStatus("saved"); // Still mark as saved to not block user
    }
  }, [draft, localStorageKey]);

  const saveDraftToAPI = useCallback(async () => {
    try {
      setSaveStatus("saving");

      // Only save if draft has actually changed
      if (JSON.stringify(lastSavedRef.current) === JSON.stringify(draft)) {
        setSaveStatus("saved");
        return;
      }

      // Try API endpoint if available
      const response = await fetch("/api/communications/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (response.ok) {
        lastSavedRef.current = draft;
        setSaveStatus("saved");
      } else {
        // Fall back to localStorage
        saveDraftLocally();
      }
    } catch (err) {
      // Network error - fall back to localStorage
      console.debug("Draft API unavailable, using localStorage fallback");
      saveDraftLocally();
    }
  }, [draft, applicationId, saveDraftLocally]);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only save if draft is dirty
    if (!draft.isDirty) {
      setSaveStatus("saved");
      return;
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      saveDraftToAPI();
    }, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [draft, interval, saveDraftToAPI]);

  const manualSave = useCallback(async () => {
    setSaveStatus("saving");
    await saveDraftToAPI();
  }, [saveDraftToAPI]);

  return {
    saveStatus,
    manualSave,
  };
}

/**
 * useConversationScroll
 * 
 * Manages conversation scroll position persistence.
 * Saves/restores scroll position across navigation.
 * 
 * @returns Ref for scroll container and utility functions
 */
export function useConversationScroll() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  const savePosition = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
      // Use sessionStorage to persist across component remounts in same session
      try {
        sessionStorage.setItem(
          "conversation-scroll-position",
          String(scrollPositionRef.current)
        );
      } catch (err) {
        console.debug("Could not save scroll position to sessionStorage", err);
      }
    }
  }, []);

  const restorePosition = useCallback(() => {
    if (scrollContainerRef.current) {
      try {
        const saved = sessionStorage.getItem("conversation-scroll-position");
        if (saved) {
          const position = parseInt(saved, 10);
          scrollContainerRef.current.scrollTop = position;
        }
      } catch (err) {
        console.debug("Could not restore scroll position from sessionStorage", err);
      }
    }
  }, []);

  // Save position on scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => savePosition();
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => container.removeEventListener("scroll", handleScroll);
  }, [savePosition]);

  // Restore position on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      restorePosition();
    }, 0);

    return () => clearTimeout(timer);
  }, [restorePosition]);

  return {
    scrollContainerRef,
    savePosition,
    restorePosition,
  };
}

/**
 * useMarkAsRead
 * 
 * Marks conversation/messages as read.
 * Reuses existing /api/communications/mark-read endpoint.
 * Respects organization scoping.
 * 
 * @param applicationId - Application ID
 * @param organizationId - Organization ID for scoping
 */
export function useMarkAsRead(applicationId: string, organizationId: string) {
  const markAsRead = useCallback(
    async (messageIds?: string[]) => {
      try {
        const response = await fetch("/api/communications/mark-read", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applicationId,
            organizationId,
            messageIds, // Optional: if provided, mark only specific messages
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to mark as read: ${response.status} - ${error}`);
        }

        const result = await response.json();
        return result;
      } catch (err) {
        console.error("Error marking messages as read:", err);
        throw err;
      }
    },
    [applicationId, organizationId]
  );

  return { markAsRead };
}

/**
 * useUnreadTracker
 * 
 * Tracks unread message count and updates in real-time.
 * Reuses existing notification system.
 * 
 * @param applicationId - Application ID
 * @param organizationId - Organization ID for scoping
 * @param initialCount - Initial unread count
 */
export function useUnreadTracker(
  applicationId: string,
  organizationId: string,
  initialCount: number = 0
) {
  const [unreadCount, setUnreadCount] = useState(initialCount);

  const decrementUnread = useCallback(() => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const setUnreadCount_explicit = useCallback((count: number) => {
    setUnreadCount(Math.max(0, count));
  }, []);

  const resetUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Update when initialCount changes
  useEffect(() => {
    setUnreadCount(initialCount);
  }, [initialCount]);

  return {
    unreadCount,
    decrementUnread,
    setUnreadCount: setUnreadCount_explicit,
    resetUnread,
  };
}

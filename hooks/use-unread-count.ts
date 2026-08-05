"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * Hook to fetch and auto-refresh unread message count
 * Useful for sidebar badges and notifications
 * 
 * Usage:
 * const { unreadCount, isLoading, error, refetch } = useUnreadCount(organizationId);
 * 
 * @param organizationId - Optional org ID (auto-detected for staff)
 * @param interval - Refresh interval in ms (default: 30000 = 30s)
 */
export function useUnreadCount(organizationId?: string, interval = 30000) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      setError(null);
      const url = new URL("/api/communications/unread-count", window.location.origin);
      if (organizationId) {
        url.searchParams.set("organizationId", organizationId);
      }
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Failed to fetch unread count");
      
      const result = await response.json();
      setUnreadCount(result.data?.unreadCount || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("[useUnreadCount] Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  // Initial fetch
  useEffect(() => {
    void fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Auto-refresh at interval
  useEffect(() => {
    if (interval <= 0) return;
    
    const timer = setInterval(() => {
      void fetchUnreadCount();
    }, interval);

    return () => clearInterval(timer);
  }, [interval, fetchUnreadCount]);

  return { unreadCount, isLoading, error, refetch: fetchUnreadCount };
}

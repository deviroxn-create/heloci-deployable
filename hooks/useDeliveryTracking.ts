import { useState, useCallback, useEffect, useRef } from "react";
import {
  getDeliveryStatusAction,
  getApplicationDeliveryHistoryAction,
  getDeliveryMetricsAction,
  getFailedNotificationsAction,
  retryNotificationAction,
  retryAllFailedNotificationsAction,
  getRetryAttemptsAction,
  searchDeliveryHistoryAction,
  type DeliveryStatus,
  type DeliveryMetrics,
  type RetryAttempt
} from "@/actions/delivery.actions";

export interface UseDeliveryTrackingOptions {
  notificationId?: string;
  applicationId?: string;
  pollInterval?: number;  // ms
  autoRefresh?: boolean;
}

export interface UseDeliveryTrackingResult {
  // State
  deliveryStatus?: DeliveryStatus;
  history: any[];
  metrics?: DeliveryMetrics;
  failedNotifications: any[];
  retryAttempts: RetryAttempt[];

  // Loading & Error
  loading: boolean;
  error: string | null;

  // Actions
  refreshStatus: () => Promise<void>;
  refreshHistory: (page?: number) => Promise<void>;
  refreshMetrics: () => Promise<void>;
  refreshFailed: () => Promise<void>;
  retryNotification: (id: string) => Promise<void>;
  retryAllFailed: () => Promise<void>;
  loadRetryAttempts: (id: string) => Promise<void>;

  // Pagination
  page: number;
  pageSize: number;
  totalPages: number;
  nextPage: () => void;
  prevPage: () => void;
}

/**
 * Hook for delivery tracking and status polling
 * Handles automatic refresh of delivery status with configurable intervals
 */
export function useDeliveryTracking(
  options: UseDeliveryTrackingOptions = {}
): UseDeliveryTrackingResult {
  const {
    notificationId,
    applicationId,
    pollInterval = 5000,  // 5 seconds
    autoRefresh = true
  } = options;

  // State
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus | undefined>();
  const [history, setHistory] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<DeliveryMetrics | undefined>();
  const [failedNotifications, setFailedNotifications] = useState<any[]>([]);
  const [retryAttempts, setRetryAttempts] = useState<RetryAttempt[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  const pollTimer = useRef<NodeJS.Timeout | null>(null);

  // Refresh single notification status
  const refreshStatus = useCallback(async () => {
    if (!notificationId) return;

    setLoading(true);
    setError(null);

    try {
      const status = await getDeliveryStatusAction(notificationId);
      setDeliveryStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status");
    } finally {
      setLoading(false);
    }
  }, [notificationId]);

  // Refresh delivery history for application
  const refreshHistory = useCallback(async (newPage?: number) => {
    if (!applicationId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getApplicationDeliveryHistoryAction(
        applicationId,
        newPage || page,
        pageSize
      );
      setHistory(result.communications);
      setTotalPages(Math.ceil(result.total / pageSize));
      if (newPage !== undefined) setPage(newPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [applicationId, page, pageSize]);

  // Refresh metrics
  const refreshMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const m = await getDeliveryMetricsAction();
      setMetrics(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh failed notifications
  const refreshFailed = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const failed = await getFailedNotificationsAction();
      setFailedNotifications(failed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load failed notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  // Retry a notification
  const handleRetry = useCallback(async (id: string) => {
    setError(null);

    try {
      await retryNotificationAction(id);
      await refreshStatus();
      await refreshFailed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to retry notification");
    }
  }, [refreshStatus, refreshFailed]);

  // Retry all failed
  const handleRetryAllFailed = useCallback(async () => {
    setError(null);

    try {
      await retryAllFailedNotificationsAction();
      await refreshFailed();
      await refreshMetrics();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to retry notifications");
    }
  }, [refreshFailed, refreshMetrics]);

  // Load retry attempts
  const loadRetryAttempts = useCallback(async (id: string) => {
    setError(null);

    try {
      const attempts = await getRetryAttemptsAction(id);
      setRetryAttempts(attempts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load retry attempts");
    }
  }, []);

  // Setup auto-polling
  useEffect(() => {
    if (!autoRefresh || !notificationId) return;

    // Initial refresh
    refreshStatus();

    // Set up polling
    pollTimer.current = setInterval(() => {
      refreshStatus();
    }, pollInterval);

    return () => {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
      }
    };
  }, [notificationId, autoRefresh, pollInterval, refreshStatus]);

  // Pagination
  const nextPage = useCallback(() => {
    if (page < totalPages) {
      refreshHistory(page + 1);
    }
  }, [page, totalPages, refreshHistory]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      refreshHistory(page - 1);
    }
  }, [page, refreshHistory]);

  return {
    deliveryStatus,
    history,
    metrics,
    failedNotifications,
    retryAttempts,
    loading,
    error,
    refreshStatus,
    refreshHistory,
    refreshMetrics,
    refreshFailed,
    retryNotification: handleRetry,
    retryAllFailed: handleRetryAllFailed,
    loadRetryAttempts,
    page,
    pageSize,
    totalPages,
    nextPage,
    prevPage
  };
}

/**
 * Hook for searching delivery history with filters
 */
export function useDeliverySearch() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const search = useCallback(async (
    filters: any,
    pageNum: number = 1
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await searchDeliveryHistoryAction(filters, pageNum, 50);
      setResults(result.results);
      setTotalPages(result.totalPages);
      setPage(result.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    results,
    loading,
    error,
    page,
    totalPages,
    search,
    nextPage: () => setPage(p => p + 1),
    prevPage: () => setPage(p => p - 1)
  };
}

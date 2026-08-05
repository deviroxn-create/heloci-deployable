"use client";

import { Mail, Send, FileText, AlertTriangle, FileCheck, MessageSquare, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  getInboxWidgetsAction,
  getEmailDeliveryRateAction,
  getFailedEmailsAction,
  getAverageReplyTimeAction,
  getOpenConversationsAction
} from "@/actions/communication-dashboard.actions";

interface WidgetProps {
  loading?: boolean;
}

/**
 * Unread Messages Widget
 */
export function UnreadMessagesWidget({ loading }: WidgetProps) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(loading ?? true);

  useEffect(() => {
    getInboxWidgetsAction()
      .then(data => {
        setCount(data.unreadInternalMessages);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  return (
    <Link href="/staff/communication/messages" className="rounded-[24px] border border-border bg-white p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-4">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
          <MessageSquare className="h-5 w-5 text-brand" />
        </div>
      </div>
      <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Unread Messages</p>
      {isLoading ? (
        <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-slate-950">{count}</p>
      )}
      <p className="text-xs text-slate-500 mt-3">Open inbox →</p>
    </Link>
  );
}

/**
 * Recent Emails Sent Widget
 */
export function RecentEmailsSentWidget({ loading }: WidgetProps) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(loading ?? true);

  useEffect(() => {
    getInboxWidgetsAction()
      .then(data => {
        setCount(data.recentEmailsSent);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  return (
    <Link href="/admin/communication/email" className="rounded-[24px] border border-border bg-white p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-4">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
          <Send className="h-5 w-5 text-success" />
        </div>
      </div>
      <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Emails Sent Today</p>
      {isLoading ? (
        <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-slate-950">{count}</p>
      )}
      <p className="text-xs text-slate-500 mt-3">View workspace →</p>
    </Link>
  );
}

/**
 * Draft Count Widget
 */
export function DraftCountWidget({ loading }: WidgetProps) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(loading ?? true);

  useEffect(() => {
    getInboxWidgetsAction()
      .then(data => {
        setCount(data.draftCount);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  return (
    <Link href="/admin/communication/email?tab=drafts" className="rounded-[24px] border border-border bg-white p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-4">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
          <FileText className="h-5 w-5 text-slate-600" />
        </div>
      </div>
      <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Draft Emails</p>
      {isLoading ? (
        <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-slate-950">{count}</p>
      )}
      <p className="text-xs text-slate-500 mt-3">Resume drafting →</p>
    </Link>
  );
}

/**
 * Failed Emails Widget
 */
export function FailedEmailsWidget({ loading }: WidgetProps) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(loading ?? true);

  useEffect(() => {
    getInboxWidgetsAction()
      .then(data => {
        setCount(data.failedEmails);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  return (
    <div className="rounded-[24px] border border-border bg-white p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-error/10">
          <AlertTriangle className="h-5 w-5 text-error" />
        </div>
      </div>
      <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Failed Emails</p>
      {isLoading ? (
        <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" />
      ) : (
        <>
          <p className="text-3xl font-bold text-slate-950">{count}</p>
          {count > 0 && (
            <p className="text-xs text-error mt-3 font-medium">
              <Link href="/admin/communication/email?tab=sent&status=failed" className="underline">
                View failed emails →
              </Link>
            </p>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Pending Document Requests Widget
 */
export function PendingDocumentsWidget({ loading }: WidgetProps) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(loading ?? true);

  useEffect(() => {
    getInboxWidgetsAction()
      .then(data => {
        setCount(data.pendingDocumentRequests);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  return (
    <Link href="/admin/applications?filter=pending_documents" className="rounded-[24px] border border-border bg-white p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-4">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
          <FileCheck className="h-5 w-5 text-warning" />
        </div>
      </div>
      <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Pending Documents</p>
      {isLoading ? (
        <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-slate-950">{count}</p>
      )}
      <p className="text-xs text-slate-500 mt-3">View applications →</p>
    </Link>
  );
}

/**
 * Email Delivery Rate Widget
 */
export function EmailDeliveryRateWidget({ loading }: WidgetProps) {
  const [rate, setRate] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(loading ?? true);

  useEffect(() => {
    getEmailDeliveryRateAction()
      .then(data => {
        setRate(data.rate);
        setTotal(data.total);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const getRateColor = () => {
    if (rate >= 90) return "text-success";
    if (rate >= 70) return "text-warning";
    return "text-error";
  };

  return (
    <Link href="/admin/communication/delivery" className="rounded-[24px] border border-border bg-white p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-4">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
          <TrendingUp className="h-5 w-5 text-brand" />
        </div>
      </div>
      <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Delivery Rate (7d)</p>
      {isLoading ? (
        <div className="h-8 w-20 bg-slate-100 rounded animate-pulse" />
      ) : (
        <>
          <p className={`text-3xl font-bold ${getRateColor()}`}>
            {rate.toFixed(0)}%
          </p>
          <p className="text-xs text-slate-500 mt-2">{total} emails sent</p>
        </>
      )}
    </Link>
  );
}

/**
 * Average Reply Time Widget
 */
export function AverageReplyTimeWidget({ loading }: WidgetProps) {
  const [hours, setHours] = useState(0);
  const [isLoading, setIsLoading] = useState(loading ?? true);

  useEffect(() => {
    getAverageReplyTimeAction()
      .then(data => {
        setHours(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const formatTime = (h: number): string => {
    if (h < 1) return `${Math.round(h * 60)}m`;
    if (h < 24) return `${Math.round(h)}h`;
    return `${Math.round(h / 24)}d`;
  };

  return (
    <div className="rounded-[24px] border border-border bg-white p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
          <Clock className="h-5 w-5 text-slate-600" />
        </div>
      </div>
      <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Avg Reply Time</p>
      {isLoading ? (
        <div className="h-8 w-20 bg-slate-100 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-slate-950">{formatTime(hours)}</p>
      )}
    </div>
  );
}

/**
 * Open Conversations Widget
 */
export function OpenConversationsWidget({ loading }: WidgetProps) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(loading ?? true);

  useEffect(() => {
    getOpenConversationsAction()
      .then(data => {
        setCount(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  return (
    <Link href="/admin/communication/messages" className="rounded-[24px] border border-border bg-white p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-4">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
          <MessageSquare className="h-5 w-5 text-brand" />
        </div>
      </div>
      <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Open Conversations</p>
      {isLoading ? (
        <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-slate-950">{count}</p>
      )}
      <p className="text-xs text-slate-500 mt-3">View all →</p>
    </Link>
  );
}

/**
 * Quick Actions Container
 */
export function CommunicationQuickActions() {
  return (
    <div className="space-y-3 rounded-[24px] border border-border bg-white p-6">
      <p className="text-sm font-semibold text-slate-950">Quick Actions</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link
          href="/admin/communication/email?action=send"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
        >
          <Send className="h-4 w-4" />
          Send Email
        </Link>
        <Link
          href="/admin/communication/messages?action=new"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
        >
          <MessageSquare className="h-4 w-4" />
          New Message
        </Link>
        <Link
          href="/admin/communication/email?tab=drafts"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
        >
          <FileText className="h-4 w-4" />
          View Drafts
        </Link>
        <Link
          href="/admin/communication/messages"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
        >
          <Mail className="h-4 w-4" />
          Open Inbox
        </Link>
      </div>
    </div>
  );
}

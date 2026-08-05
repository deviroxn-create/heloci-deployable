"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Clock,
  TrendingUp,
  AlertTriangle,
  FileText,
  Users,
} from "lucide-react";

interface Metrics {
  messagesToday: number;
  emailsSent: number;
  replyRate: number;
  averageResponseTime: number;
  openConversations: number;
  failedEmails: number;
  pendingDocuments: number;
  mostActiveStaff: Array<{
    name: string;
    email: string;
    messageCount: number;
    emailCount: number;
  }>;
}

interface CommunicationMetricsDashboardProps {
  metrics: Metrics;
  loading?: boolean;
}

/**
 * Communication metrics dashboard
 * Shows key performance indicators for communication center
 */
export function CommunicationMetricsDashboard({
  metrics,
  loading = false,
}: CommunicationMetricsDashboardProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="animate-pulse">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="h-8 w-8 bg-slate-100 rounded mb-2" />
              <div className="h-4 w-24 bg-slate-100 rounded mb-3" />
              <div className="h-6 w-12 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const metricItems = [
    {
      label: "Messages Today",
      value: metrics.messagesToday,
      icon: MessageSquare,
      color: "text-brand",
      bgColor: "bg-brand/10",
    },
    {
      label: "Emails Sent",
      value: metrics.emailsSent,
      icon: Send,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Reply Rate",
      value: `${metrics.replyRate}%`,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Avg Response Time",
      value: `${metrics.averageResponseTime}h`,
      icon: Clock,
      color: "text-slate-600",
      bgColor: "bg-slate-100",
    },
    {
      label: "Open Conversations",
      value: metrics.openConversations,
      icon: MessageSquare,
      color: "text-brand",
      bgColor: "bg-brand/10",
    },
    {
      label: "Failed Emails",
      value: metrics.failedEmails,
      icon: AlertTriangle,
      color: "text-error",
      bgColor: "bg-error/10",
    },
    {
      label: "Pending Documents",
      value: metrics.pendingDocuments,
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricItems.map((item, index) => (
          <MetricCard key={index} {...item} />
        ))}
      </div>

      {/* Most Active Staff */}
      {metrics.mostActiveStaff.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Most Active Staff</h3>
          </div>

          <div className="space-y-3">
            {metrics.mostActiveStaff.map((staff, index) => (
              <div
                key={staff.email}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm text-slate-900">
                    {index + 1}. {staff.name}
                  </p>
                  <p className="text-xs text-slate-500">{staff.email}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {staff.messageCount}
                    </p>
                    <p className="text-xs text-slate-500">messages</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {staff.emailCount}
                    </p>
                    <p className="text-xs text-slate-500">emails</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

/**
 * Individual metric card
 */
function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
}: MetricCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-sm transition">
      <div className={`flex items-center justify-center h-10 w-10 rounded-lg ${bgColor} mb-3`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

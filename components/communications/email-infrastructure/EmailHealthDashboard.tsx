'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, AlertCircle, Clock, Send, CheckCircle2, RotateCcw } from 'lucide-react';
import type { EmailMetrics } from '@/lib/communications/email-infrastructure.service';

interface EmailHealthDashboardProps {
  metrics: EmailMetrics;
  loading?: boolean;
}

export function EmailHealthDashboard({ metrics, loading = false }: EmailHealthDashboardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
            <div className="h-6 bg-slate-100 rounded w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  const metricCards = [
    {
      label: 'Emails Sent Today',
      value: metrics.emailsSentToday.toString(),
      icon: Send,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Delivery Rate',
      value: `${Math.round(metrics.deliveryRate)}%`,
      icon: CheckCircle2,
      color: metrics.deliveryRate >= 95 ? 'text-green-600' : 'text-yellow-600',
      bgColor: metrics.deliveryRate >= 95 ? 'bg-green-50' : 'bg-yellow-50',
    },
    {
      label: 'Failure Rate',
      value: `${Math.round(metrics.failureRate)}%`,
      icon: AlertCircle,
      color: metrics.failureRate > 5 ? 'text-red-600' : 'text-slate-600',
      bgColor: metrics.failureRate > 5 ? 'bg-red-50' : 'bg-slate-100',
    },
    {
      label: 'Avg Delivery Time',
      value: `${Math.round(metrics.averageDeliveryTime * 10) / 10}s`,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-950">Email Health Dashboard</h3>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="p-4">
              <div className={`inline-flex p-2 rounded-lg ${card.bgColor} mb-3`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="text-xs font-medium text-slate-500 uppercase">{card.label}</p>
              <p className="text-2xl font-bold text-slate-950 mt-1">{card.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Queue Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <RotateCcw className="h-4 w-4 text-amber-600" />
            <p className="text-xs font-medium text-slate-500 uppercase">Retry Queue</p>
          </div>
          <p className="text-2xl font-bold text-slate-950">{metrics.retryQueueCount}</p>
          <p className="text-xs text-slate-500 mt-1">Pending retry</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <p className="text-xs font-medium text-slate-500 uppercase">Pending</p>
          </div>
          <p className="text-2xl font-bold text-slate-950">{metrics.pendingQueueCount}</p>
          <p className="text-xs text-slate-500 mt-1">In progress</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-xs font-medium text-slate-500 uppercase">Bounces</p>
          </div>
          <p className="text-2xl font-bold text-slate-950">{metrics.bounceCount}</p>
          <p className="text-xs text-slate-500 mt-1">Invalid addresses</p>
        </Card>
      </div>

      {/* Last Activity */}
      {metrics.lastEmailSent && (
        <Card className="p-4 bg-slate-50">
          <p className="text-xs font-medium text-slate-500 uppercase">Last Email Sent</p>
          <p className="text-sm text-slate-950 mt-1">
            {new Date(metrics.lastEmailSent).toLocaleString()}
          </p>
        </Card>
      )}
    </div>
  );
}

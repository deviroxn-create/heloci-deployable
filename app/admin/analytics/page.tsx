import { TrendingUp, TrendingDown, BarChart3, Users, Clock3, CheckCircle2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";

const kpis = [
  {
    title: "Applications this month",
    value: "114",
    change: "+18%",
    trend: "up",
    icon: BarChart3,
    accent: "bg-brand/10 text-brand"
  },
  {
    title: "Approval rate",
    value: "71%",
    change: "+4%",
    trend: "up",
    icon: CheckCircle2,
    accent: "bg-success/10 text-success"
  },
  {
    title: "Avg. time to decision",
    value: "5.2 days",
    change: "-0.8 days",
    trend: "up",
    icon: Clock3,
    accent: "bg-info/10 text-info"
  },
  {
    title: "Active applicants",
    value: "1,042",
    change: "+38",
    trend: "up",
    icon: Users,
    accent: "bg-warning/10 text-warning"
  }
];

const monthlyVolume = [
  { month: "Jan", applications: 74, approved: 48 },
  { month: "Feb", applications: 82, approved: 56 },
  { month: "Mar", applications: 91, approved: 60 },
  { month: "Apr", applications: 78, approved: 52 },
  { month: "May", applications: 99, approved: 72 },
  { month: "Jun", applications: 114, approved: 81 }
];

const programBreakdown = [
  { program: "Family Housing", count: 186, pct: 42 },
  { program: "Veteran Housing", count: 110, pct: 25 },
  { program: "Emergency Shelter", count: 79, pct: 18 },
  { program: "Transitional Housing", count: 66, pct: 15 }
];

const outcomeData = [
  { label: "Approved", value: 76, color: "bg-success" },
  { label: "Pending", value: 89, color: "bg-warning" },
  { label: "Under review", value: 56, color: "bg-brand" },
  { label: "Waitlisted", value: 27, color: "bg-slate-300" },
  { label: "Rejected", value: 27, color: "bg-error" }
];

const maxVolume = Math.max(...monthlyVolume.map((m) => m.applications));

export default function AdminAnalyticsPage() {
  return (
    <AdminShell
      title="Analytics"
      description="Program metrics, approval rates, and applicant cohort outcomes."
      actions={<Button size="sm" variant="outline">Export report</Button>}
    >
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.title} className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-3xl ${kpi.accent}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{kpi.title}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-950">{kpi.value}</p>
              <div className="mt-2 flex items-center gap-1">
                {kpi.trend === "up" ? (
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-error" />
                )}
                <span className="text-xs font-semibold text-success">{kpi.change}</span>
                <span className="text-xs text-slate-400">vs last month</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Bar chart — monthly volume */}
        <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Volume</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">Monthly applications vs approvals</h2>
          <div className="mt-6 flex items-end justify-between gap-2 h-40">
            {monthlyVolume.map((item) => (
              <div key={item.month} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex flex-col items-center gap-1 w-full">
                  <div
                    className="w-full rounded-t-xl bg-brand/20"
                    style={{ height: `${(item.applications / maxVolume) * 120}px` }}
                    title={`${item.applications} applications`}
                  />
                  <div
                    className="w-full rounded-t-xl bg-brand"
                    style={{ height: `${(item.approved / maxVolume) * 120}px`, marginTop: "-4px" }}
                    title={`${item.approved} approved`}
                  />
                </div>
                <span className="text-xs text-slate-500">{item.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand/20" />Applications</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand" />Approvals</span>
          </div>
        </div>

        {/* Outcome donut proxy */}
        <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Outcomes</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">Application status breakdown</h2>
          <div className="mt-6 space-y-3">
            {outcomeData.map((item) => {
              const total = outcomeData.reduce((sum, d) => sum + d.value, 0);
              const pct = Math.round((item.value / total) * 100);
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-700">{item.label}</span>
                    <span className="font-semibold tabular-nums text-slate-950">{item.value} <span className="text-xs text-slate-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Program breakdown */}
      <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Programs</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">Applications by program</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {programBreakdown.map((item) => (
            <div key={item.program} className="rounded-[24px] bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-950">{item.program}</p>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-950">{item.count}</p>
              <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-brand" style={{ width: `${item.pct}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">{item.pct}% of total</p>
            </div>
          ))}
        </div>
      </div>

      {/* Time to decision by program */}
      <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Efficiency</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">Average time to decision</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Family Housing", days: "5.4 days", change: "-0.6" },
            { label: "Veteran Housing", days: "4.1 days", change: "-1.2" },
            { label: "Emergency Shelter", days: "2.8 days", change: "-0.3" },
            { label: "Transitional Housing", days: "6.2 days", change: "+0.4" }
          ].map((item) => (
            <div key={item.label} className="rounded-[24px] bg-slate-50 p-5">
              <p className="text-xs font-semibold text-slate-500">{item.label}</p>
              <p className="mt-3 text-xl font-semibold text-slate-950">{item.days}</p>
              <p className={`mt-1 text-xs font-semibold ${item.change.startsWith("-") ? "text-success" : "text-error"}`}>
                {item.change} days vs last month
              </p>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

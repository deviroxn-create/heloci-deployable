import {
  ClipboardList,
  Users,
  Building2,
  TrendingUp,
  // Clock3 unused
  AlertTriangle,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";

const stats = [
  {
    title: "Total applications",
    value: "248",
    change: "+14 this week",
    icon: ClipboardList,
    accent: "bg-brand/10 text-brand"
  },
  {
    title: "Active users",
    value: "1,042",
    change: "+38 this month",
    icon: Users,
    accent: "bg-success/10 text-success"
  },
  {
    title: "Properties listed",
    value: "64",
    change: "12 new this month",
    icon: Building2,
    accent: "bg-info/10 text-info"
  },
  {
    title: "Approval rate",
    value: "71%",
    change: "+4% vs last month",
    icon: TrendingUp,
    accent: "bg-warning/10 text-warning"
  }
];

const recentApplications = [
  { id: "APP-5412", name: "Amara Singh", program: "Family Housing", status: "Pending", time: "2h ago" },
  { id: "APP-5411", name: "Carlos Reyes", program: "Veteran Housing", status: "Under review", time: "4h ago" },
  { id: "APP-5410", name: "Lena Fischer", program: "Emergency Shelter", status: "Approved", time: "Yesterday" },
  { id: "APP-5409", name: "Darius Webb", program: "Family Housing", status: "Rejected", time: "Yesterday" },
  { id: "APP-5408", name: "Priya Patel", program: "Transitional Housing", status: "Waitlisted", time: "2 days ago" }
];

const statusStyles: Record<string, string> = {
  Pending: "bg-warning/10 text-warning",
  "Under review": "bg-brand/10 text-brand",
  Approved: "bg-success/10 text-success",
  Rejected: "bg-error/10 text-error",
  Waitlisted: "bg-slate-100 text-slate-700"
};

const auditActivity = [
  { action: "Status updated to Approved", entity: "Application APP-5410", user: "Staff: Maya T.", time: "4h ago" },
  { action: "New property added", entity: "Willow Creek Unit #4B", user: "Admin: David N.", time: "6h ago" },
  { action: "User role changed to STAFF", entity: "Marcus D.", user: "Admin: David N.", time: "Yesterday" },
  { action: "Application rejected", entity: "APP-5409", user: "Staff: Priya A.", time: "Yesterday" }
];

export default function AdminDashboardPage() {
  return (
    <AdminShell
      title="Admin dashboard"
      description="Platform health, pending actions, and audit activity at a glance."
      actions={
        <Link href="/admin/applications">
          <Button size="sm">Open application queue</Button>
        </Link>
      }
    >
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-3xl ${stat.accent}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{stat.title}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-950">{stat.value}</p>
              <p className="mt-2 text-xs text-slate-500">{stat.change}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        {/* Recent applications */}
        <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Applications</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Recent submissions</h2>
            </div>
            <Link href="/admin/applications">
              <Button variant="outline" size="sm">View all</Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentApplications.map((app) => (
              <div key={app.id} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-border text-xs font-bold text-slate-700 shadow-sm">
                    {app.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{app.name}</p>
                    <p className="text-xs text-slate-500">{app.id} · {app.program}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[app.status]}`}>
                    {app.status}
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:block">{app.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions + alerts */}
        <div className="space-y-4">
          <div className="rounded-[28px] border border-border bg-white p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 mb-4">Quick actions</p>
            <div className="space-y-2">
              {[
                { label: "Review pending applications", href: "/admin/applications", icon: ClipboardList },
                { label: "Manage staff roster", href: "/admin/staff", icon: Users },
                { label: "Add new property", href: "/admin/properties", icon: Building2 },
                { label: "View analytics", href: "/admin/analytics", icon: TrendingUp }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-brand" />
                      {item.label}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-warning/20 bg-warning/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-warning">Needs attention</p>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl bg-white p-3">
                <p className="text-sm font-semibold text-slate-950">12 documents unreviewed</p>
                <p className="text-xs text-slate-500 mt-1">Submitted over 48 hours ago</p>
              </div>
              <div className="rounded-2xl bg-white p-3">
                <p className="text-sm font-semibold text-slate-950">3 staff accounts inactive</p>
                <p className="text-xs text-slate-500 mt-1">No login in 30+ days</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit log */}
      <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Audit trail</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Recent activity</h2>
          </div>
          <Link href="/admin/analytics">
            <Button variant="ghost" size="sm">View full log</Button>
          </Link>
        </div>
        <div className="space-y-3">
          {auditActivity.map((entry, i) => (
            <div key={i} className="flex items-start gap-4 rounded-2xl bg-slate-50 px-4 py-3">
              <div className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white border border-border shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-950">{entry.action}</p>
                <p className="text-xs text-slate-500 mt-0.5">{entry.entity} · {entry.user}</p>
              </div>
              <span className="text-xs text-slate-400 shrink-0">{entry.time}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

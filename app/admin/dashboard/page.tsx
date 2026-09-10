import {
  ClipboardList,
  Users,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Clock,
  FileText,
  Eye,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { getOrgDashboard } from "@/lib/organizations/dashboard-service";

async function getDashboardData() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=/admin/dashboard");
  }

  // Platform Super Admin needs to select an organization
  // Allow Platform Admin to see first org, but provide mechanism to switch
  if (user.isPlatformAdmin) {
    // Get all organizations for super admin to potentially switch between
    const organizations = await prisma.organization.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { createdAt: 'asc' }
    });
    
    if (organizations.length === 0) {
      throw new Error("No organizations available");
    }
    
    // Use the first organization by default, but mark as platform admin viewing org
    const selectedOrgId = organizations[0].id;
    const stats = await getOrgDashboard(selectedOrgId, user.id);
    
    return { 
      ...stats, 
      isPlatformAdmin: true, 
      currentOrgId: selectedOrgId,
      allOrganizations: organizations,
      selectedOrgName: organizations[0].name
    };
  }

  // Regular organization users
  if (!user.organizationId) {
    redirect("/login?error=no_organization");
  }

  try {
    const stats = await getOrgDashboard(user.organizationId, user.id);
    return { ...stats, isPlatformAdmin: false };
  } catch (error) {
    console.error("Failed to load dashboard:", error);
    throw error;
  }
}

function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    under_review: "bg-brand/10 text-brand",
    approved: "bg-success/10 text-success",
    rejected: "bg-error/10 text-error",
    waitlisted: "bg-slate-100 text-slate-700",
    draft: "bg-slate-100 text-slate-500"
  };
  return statusMap[status.toLowerCase()] || "bg-slate-100 text-slate-700";
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

function formatEventType(type: string): string {
  const typeMap: Record<string, string> = {
    submitted: "Application Submitted",
    status_changed: "Status Updated",
    assigned: "Assigned to Staff",
    document_requested: "Document Requested",
    document_uploaded: "Document Uploaded",
    approved: "Application Approved",
    rejected: "Application Rejected",
    waitlisted: "Added to Waitlist"
  };
  return typeMap[type.toLowerCase()] || type;
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  const kpiCards = [
    {
      title: "Pending Review",
      value: data.pendingReview,
      description: "Submitted, awaiting review",
      icon: ClipboardList,
      accent: "bg-warning/10 text-warning"
    },
    {
      title: "Under Review",
      value: data.underReview,
      description: "Assigned to staff",
      icon: Eye,
      accent: "bg-brand/10 text-brand"
    },
    {
      title: "Approved Today",
      value: data.approvedToday,
      description: `Approved today`,
      icon: CheckCircle2,
      accent: "bg-success/10 text-success"
    },
    {
      title: "Rejected Today",
      value: data.rejectedToday,
      description: "Rejected today",
      icon: AlertCircle,
      accent: "bg-error/10 text-error"
    },
    {
      title: "Waiting Documents",
      value: data.waitingDocuments,
      description: "Pending applicant submission",
      icon: FileText,
      accent: "bg-info/10 text-info"
    },
    {
      title: "Unread Notifications",
      value: data.unreadNotifications,
      description: "Internal notifications",
      icon: AlertTriangle,
      accent: "bg-warning/10 text-warning"
    }
  ];

  return (
    <AdminShell
      title="Staff Dashboard"
      description="Real-time view of applications, programs, and team activity."
      actions={
        <Link href="/admin/applications">
          <Button size="sm">Open application queue</Button>
        </Link>
      }
    >
      {/* KPI Cards - Row 1 */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-[28px] border border-border bg-white p-4 shadow-soft">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${card.accent}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{card.title}</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{card.value}</p>
              <p className="mt-1 text-xs text-slate-500">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* Row 2: Application Queue + Program Activity */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] 2xl:grid-cols-[1.6fr_1fr]">
        {/* Application Queue */}
        <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">Applications</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Queue</h2>
            </div>
            <Link href="/admin/applications">
              <Button variant="outline" size="sm">View all</Button>
            </Link>
          </div>

          {data.recentApplications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">No applications yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {data.recentApplications.map((app) => (
                <div key={app.id} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 hover:bg-slate-100 transition">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white border border-border text-xs font-bold text-slate-700 flex-shrink-0">
                      {app.applicantName?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-950 truncate">{app.applicantName || "Unknown"}</p>
                      <p className="text-xs text-slate-500 truncate">{app.programName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(app.status)}`}>
                      {app.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Program Activity */}
        <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">Programs</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Activity</h2>
          </div>

          {data.programActivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">No programs yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {data.programActivity.map((prog) => (
                <div key={prog.id} className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-950 mb-2">{prog.name}</p>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <p className="text-slate-500">Total</p>
                      <p className="font-bold text-slate-950">{prog.applications}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Pending</p>
                      <p className="font-bold text-warning">{prog.pending}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Approved</p>
                      <p className="font-bold text-success">{prog.approved}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Rejected</p>
                      <p className="font-bold text-error">{prog.rejected}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Staff Workload */}
      <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">Team</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Staff workload</h2>
          </div>
          <Link href="/admin/staff">
            <Button variant="outline" size="sm">Manage staff</Button>
          </Link>
        </div>

        {data.staffWorkload.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">No staff members assigned to this organization</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider sticky left-0 z-10 bg-white">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Role</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Assigned</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Open</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Completed</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {data.staffWorkload.map((staff) => (
                  <tr key={staff.id} className="border-b border-border hover:bg-slate-50">
                    <td className="py-3 px-4 sticky left-0 z-10 bg-white hover:bg-slate-50">
                      <p className="font-semibold text-slate-950">{staff.name || staff.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-brand/10 text-brand font-medium">
                        {staff.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-slate-950">{staff.assignedCases}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-semibold ${staff.openCases > 5 ? "text-error" : "text-slate-950"}`}>
                        {staff.openCases}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-success">{staff.completedThisWeek}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {staff.lastActivityAt ? formatRelativeTime(staff.lastActivityAt) : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row 4: Recent Activity Timeline */}
      <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">Activity</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Recent events</h2>
          </div>
        </div>

        {data.activityTimeline.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.activityTimeline.map((event, idx) => (
              <div key={event.id} className="flex gap-4 relative pb-4">
                {idx !== data.activityTimeline.length - 1 && (
                  <div className="absolute left-[15px] top-10 h-8 w-0.5 bg-border" />
                )}
                <div className="flex-shrink-0 mt-1">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand border border-brand/20">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-slate-950">{formatEventType(event.type)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {event.actorName && `${event.actorName} • `}
                    {event.programName}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(event.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar - Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3 2xl:grid-cols-[2fr_1fr]">
        <div className="rounded-[28px] border border-border bg-white p-6 shadow-soft xl:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Quick actions</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Review Applications", href: "/admin/applications", icon: ClipboardList },
              { label: "Manage Programs", href: "/admin/programs", icon: Building2 },
              { label: "Applicant Search", href: "/admin/users", icon: Users },
              { label: "Document Review", href: "/admin/documents", icon: FileText },
              { label: "Notifications", href: "/admin/communication/delivery", icon: AlertTriangle },
              { label: "Settings", href: "/admin/settings", icon: TrendingUp }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <button className="w-full flex items-center justify-between rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition">
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-brand" />
                      {item.label}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Attention Items */}
        <div className="rounded-[28px] border border-warning/20 bg-warning/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <p className="text-xs font-semibold uppercase tracking-wider text-warning">Needs attention</p>
          </div>
          <div className="space-y-3">
            {data.waitingDocuments > 0 && (
              <div className="rounded-xl bg-white p-3 border border-warning/20">
                <p className="text-sm font-semibold text-slate-950">{data.waitingDocuments} documents waiting</p>
                <p className="text-xs text-slate-500 mt-1">Pending applicant submission</p>
              </div>
            )}
            {data.pendingReview > 0 && (
              <div className="rounded-xl bg-white p-3 border border-warning/20">
                <p className="text-sm font-semibold text-slate-950">{data.pendingReview} applications pending</p>
                <p className="text-xs text-slate-500 mt-1">Awaiting staff review</p>
              </div>
            )}
            {data.unreadNotifications > 0 && (
              <div className="rounded-xl bg-white p-3 border border-warning/20">
                <p className="text-sm font-semibold text-slate-950">{data.unreadNotifications} unread notifications</p>
                <p className="text-xs text-slate-500 mt-1">Internal messages</p>
              </div>
            )}
            {data.waitingDocuments === 0 && data.pendingReview === 0 && data.unreadNotifications === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">All caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

import { redirect } from "next/navigation";
import { Users, ClipboardList, MessageSquare } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AddStaffModalTrigger } from "@/components/admin/add-staff-trigger";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export default async function AdminStaffPage() {
  const user = await getCurrentUser();
  
  // Platform Super Admin should not access organization-specific staff page
  if (user?.isPlatformAdmin) {
    redirect("/admin/dashboard");
  }
  
  if (!user?.organizationId) {
    redirect("/admin/dashboard");
  }

  const staffMembers = await prisma.organizationMember.findMany({
    where: { organizationId: user.organizationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          assignedApplications: {
            select: { id: true, status: true }
          }
        }
      }
    },
    orderBy: { createdAt: "asc" }
  });

  const totalStaff = staffMembers.length;
  const activeStaff = staffMembers.filter((member) => member.user.role !== "APPLICANT").length;
  const openCases = staffMembers.reduce((sum, member) => sum + member.user.assignedApplications.filter((app) => app.status !== "APPROVED" && app.status !== "REJECTED").length, 0);

  return (
    <>
      <AdminShell
        title="Staff management"
        description="View staff case loads, track performance, and manage accounts."
        actions={
          <AddStaffModalTrigger />
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total staff", value: String(totalStaff) },
            { label: "Active team", value: String(activeStaff) },
            { label: "Total open cases", value: String(openCases) }
          ].map((item) => (
            <div key={item.label} className="rounded-[24px] border border-border bg-white px-5 py-4 text-center shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-950">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {staffMembers.map((member) => {
            const assignedCases = member.user.assignedApplications.filter((app) => app.status !== "APPROVED" && app.status !== "REJECTED").length;
            const resolved = member.user.assignedApplications.filter((app) => app.status === "APPROVED" || app.status === "REJECTED").length;
            const status = member.role === "org_admin" ? "Admin" : member.role === "reviewer" ? "Review" : "Member";
            return (
              <div key={member.id} className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-lg font-bold text-brand">
                      {member.user.name?.charAt(0) || member.user.email.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">{member.user.name || member.user.email}</p>
                      <p className="text-xs text-slate-500">{member.user.email}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                    {status}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-slate-50 px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-brand">
                      <ClipboardList className="h-3.5 w-3.5" />
                    </div>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-slate-950">{assignedCases}</p>
                    <p className="text-xs text-slate-500">Open cases</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-success">
                      <Users className="h-3.5 w-3.5" />
                    </div>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-slate-950">{resolved}</p>
                    <p className="text-xs text-slate-500">Resolved</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-warning">
                      <MessageSquare className="h-3.5 w-3.5" />
                    </div>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-slate-950">{member.user.assignedApplications.length}</p>
                    <p className="text-xs text-slate-500">Assigned</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AdminShell>
    </>
  );
}


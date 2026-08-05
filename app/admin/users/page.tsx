import { Search } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

const roleStyles: Record<string, string> = {
  APPLICANT: "bg-brand/10 text-brand",
  STAFF: "bg-info/10 text-info",
  ADMIN: "bg-slate-900 text-white"
};

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  
  // Platform Super Admin should not access organization-specific users page
  if (user?.isPlatformAdmin) {
    redirect("/admin/dashboard");
  }
  
  if (!user?.organizationId) {
    redirect("/admin/dashboard");
  }

  const users = await prisma.user.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });

  const totalUsers = users.length;
  const staffMembers = users.filter((entry) => entry.role === "STAFF" || entry.role === "ADMIN").length;
  const admins = users.filter((entry) => entry.role === "ADMIN").length;

  return (
    <AdminShell
      title="User management"
      description="Review the real accounts connected to your organization and their current roles."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total users", value: String(totalUsers) },
          { label: "Staff members", value: String(staffMembers) },
          { label: "Admins", value: String(admins) }
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] border border-border bg-white px-5 py-4 text-center shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-950">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-[24px] border border-border bg-white px-4 py-3 shadow-soft">
        <Search className="h-4 w-4 text-slate-400 shrink-0" />
        <input
          type="search"
          placeholder="Search by name, email, or role…"
          className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          aria-label="Search users"
        />
      </div>

      <div className="rounded-[28px] border border-border bg-white shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">User</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Role</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Joined</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((account) => (
                <tr key={account.id} className="transition hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-xs font-bold text-brand">
                        {(account.name || account.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950">{account.name || account.email}</p>
                        <p className="text-xs text-slate-500">{account.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyles[account.role] || "bg-slate-100 text-slate-600"}`}>
                      {account.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">{new Date(account.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

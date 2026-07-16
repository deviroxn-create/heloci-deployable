import { Users, Search, UserCog, UserX } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";

const users = [
  { id: "USR-001", name: "Amara Singh", email: "amara.singh@email.com", role: "APPLICANT", joined: "Jun 1, 2026", status: "Active" },
  { id: "USR-002", name: "Carlos Reyes", email: "carlos.r@email.com", role: "APPLICANT", joined: "May 28, 2026", status: "Active" },
  { id: "USR-003", name: "Maya Thompson", email: "maya.t@heloci.ngo", role: "STAFF", joined: "Mar 15, 2026", status: "Active" },
  { id: "USR-004", name: "Priya Anand", email: "priya.a@heloci.ngo", role: "STAFF", joined: "Feb 2, 2026", status: "Active" },
  { id: "USR-005", name: "David Nkosi", email: "d.nkosi@heloci.ngo", role: "ADMIN", joined: "Jan 10, 2026", status: "Active" },
  { id: "USR-006", name: "Lena Fischer", email: "lena.f@email.com", role: "APPLICANT", joined: "Jun 15, 2026", status: "Inactive" }
];

const roleStyles: Record<string, string> = {
  APPLICANT: "bg-brand/10 text-brand",
  STAFF: "bg-info/10 text-info",
  ADMIN: "bg-slate-900 text-white"
};

const statusStyles: Record<string, string> = {
  Active: "bg-success/10 text-success",
  Inactive: "bg-slate-100 text-slate-500"
};

export default function AdminUsersPage() {
  return (
    <AdminShell
      title="User management"
      description="Search, manage roles, and oversee all applicant, staff, and admin accounts."
      actions={
        <Button size="sm">
          <Users className="h-4 w-4 mr-2" />
          Invite user
        </Button>
      }
    >
      {/* Counters */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total users", value: "1,042" },
          { label: "Staff members", value: "18" },
          { label: "Admins", value: "3" }
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] border border-border bg-white px-5 py-4 text-center shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-950">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-[24px] border border-border bg-white px-4 py-3 shadow-soft">
        <Search className="h-4 w-4 text-slate-400 shrink-0" />
        <input
          type="search"
          placeholder="Search by name, email, or role…"
          className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          aria-label="Search users"
        />
      </div>

      {/* Role tabs */}
      <div className="flex gap-2">
        {["All roles", "APPLICANT", "STAFF", "ADMIN"].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === "All roles"
                ? "bg-brand text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* User table */}
      <div className="rounded-[28px] border border-border bg-white shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">User</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Role</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Joined</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="transition hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-xs font-bold text-brand">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyles[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">{user.joined}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[user.status]}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white text-slate-600 transition hover:border-brand hover:text-brand" aria-label={`Edit role for ${user.name}`}>
                        <UserCog className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-error/20 bg-error/5 text-error transition hover:bg-error/10" aria-label={`Revoke access for ${user.name}`}>
                        <UserX className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm text-slate-500">
          <p>Showing 6 of 1,042</p>
          <div className="flex gap-2">
            <button type="button" className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50">Previous</button>
            <button type="button" className="rounded-xl bg-brand px-3 py-1.5 text-xs font-medium text-white">Next</button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

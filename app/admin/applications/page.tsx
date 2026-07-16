import { Search, Filter, Eye, MessageSquare } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";

const applications = [
  {
    id: "APP-5412",
    name: "Amara Singh",
    email: "amara.singh@email.com",
    program: "Family Housing",
    status: "Pending",
    submitted: "Jun 24, 2026",
    income: "$32,000",
    household: 4
  },
  {
    id: "APP-5411",
    name: "Carlos Reyes",
    email: "carlos.r@email.com",
    program: "Veteran Housing",
    status: "Under review",
    submitted: "Jun 22, 2026",
    income: "$28,500",
    household: 2
  },
  {
    id: "APP-5410",
    name: "Lena Fischer",
    email: "lena.f@email.com",
    program: "Emergency Shelter",
    status: "Approved",
    submitted: "Jun 20, 2026",
    income: "$21,000",
    household: 3
  },
  {
    id: "APP-5409",
    name: "Darius Webb",
    email: "d.webb@email.com",
    program: "Family Housing",
    status: "Rejected",
    submitted: "Jun 18, 2026",
    income: "$58,000",
    household: 2
  },
  {
    id: "APP-5408",
    name: "Priya Patel",
    email: "priya.p@email.com",
    program: "Transitional Housing",
    status: "Waitlisted",
    submitted: "Jun 17, 2026",
    income: "$26,000",
    household: 5
  },
  {
    id: "APP-5407",
    name: "Marcus Johnson",
    email: "marcus.j@email.com",
    program: "Veteran Housing",
    status: "Approved",
    submitted: "Jun 15, 2026",
    income: "$19,000",
    household: 1
  }
];

const statusStyles: Record<string, string> = {
  Pending: "bg-warning/10 text-warning",
  "Under review": "bg-brand/10 text-brand",
  Approved: "bg-success/10 text-success",
  Rejected: "bg-error/10 text-error",
  Waitlisted: "bg-slate-100 text-slate-700"
};

const tabs = ["All", "Pending", "Under review", "Approved", "Rejected", "Waitlisted"];

export default function AdminApplicationsPage() {
  return (
    <AdminShell
      title="Application queue"
      description="Review, filter, and take action on all housing applications."
      actions={
        <Button size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      }
    >
      {/* Summary strip */}
      <div className="grid gap-4 sm:grid-cols-5">
        {[
          { label: "Total", value: "248", color: "text-slate-950" },
          { label: "Pending", value: "89", color: "text-warning" },
          { label: "Under review", value: "56", color: "text-brand" },
          { label: "Approved", value: "76", color: "text-success" },
          { label: "Rejected", value: "27", color: "text-error" }
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] border border-border bg-white px-5 py-4 shadow-soft text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
            <p className={`mt-2 text-2xl font-semibold tabular-nums ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Search + tabs */}
      <div className="rounded-[28px] border border-border bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-slate-50 px-4 py-2.5">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="search"
              placeholder="Search by name, ID, or program…"
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              aria-label="Search applications"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                tab === "All"
                  ? "bg-brand text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[28px] border border-border bg-white shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50">
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Applicant</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Program</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Income</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Household</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Submitted</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {applications.map((app) => (
                <tr key={app.id} className="transition hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-xs font-bold text-brand">
                        {app.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950">{app.name}</p>
                        <p className="text-xs text-slate-500">{app.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{app.program}</td>
                  <td className="px-5 py-4 text-slate-700 tabular-nums">{app.income}</td>
                  <td className="px-5 py-4 text-slate-700">{app.household}</td>
                  <td className="px-5 py-4 text-slate-500 text-xs">{app.submitted}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[app.status]}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white text-slate-600 transition hover:border-brand hover:text-brand" aria-label={`View ${app.name}`}>
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white text-slate-600 transition hover:border-brand hover:text-brand" aria-label={`Message ${app.name}`}>
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm text-slate-500">
          <p>Showing 6 of 248</p>
          <div className="flex gap-2">
            <button type="button" className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50">Previous</button>
            <button type="button" className="rounded-xl bg-brand px-3 py-1.5 text-xs font-medium text-white">Next</button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

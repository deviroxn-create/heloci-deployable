import { Eye, MessageSquare } from "lucide-react";
import { StaffShell } from "@/components/staff/staff-shell";
// Button not used in this file

const cases = [
  {
    id: "APP-5412",
    name: "Amara Singh",
    email: "amara.singh@email.com",
    program: "Family Housing",
    status: "Pending",
    income: "$32,000",
    household: 4,
    submitted: "Jun 24, 2026",
    docsUploaded: 1,
    docsNeeded: 3
  },
  {
    id: "APP-5411",
    name: "Carlos Reyes",
    email: "carlos.r@email.com",
    program: "Veteran Housing",
    status: "Under review",
    income: "$28,500",
    household: 2,
    submitted: "Jun 22, 2026",
    docsUploaded: 3,
    docsNeeded: 3
  },
  {
    id: "APP-5408",
    name: "Priya Patel",
    email: "priya.p@email.com",
    program: "Transitional Housing",
    status: "Pending",
    income: "$26,000",
    household: 5,
    submitted: "Jun 17, 2026",
    docsUploaded: 0,
    docsNeeded: 3
  },
  {
    id: "APP-5410",
    name: "Lena Fischer",
    email: "lena.f@email.com",
    program: "Emergency Shelter",
    status: "Approved",
    income: "$21,000",
    household: 3,
    submitted: "Jun 20, 2026",
    docsUploaded: 3,
    docsNeeded: 3
  }
];

const statusStyles: Record<string, string> = {
  Pending: "bg-warning/10 text-warning",
  "Under review": "bg-brand/10 text-brand",
  Approved: "bg-success/10 text-success",
  Rejected: "bg-error/10 text-error"
};

function getProgressWidthClass(uploaded: number, needed: number) {
  if (!needed) return "w-0";
  const ratio = (uploaded / needed) * 100;
  if (ratio <= 0) return "w-0";
  if (ratio <= 25) return "w-1/4";
  if (ratio <= 50) return "w-1/2";
  if (ratio <= 75) return "w-3/4";
  return "w-full";
}

export default function StaffApplicationsPage() {
  return (
    <StaffShell
      title="My cases"
      description="Manage your assigned housing applications and move them toward resolution."
    >
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total assigned", value: "12", color: "text-slate-950" },
          { label: "Pending", value: "6", color: "text-warning" },
          { label: "In review", value: "4", color: "text-brand" },
          { label: "Approved", value: "2", color: "text-success" }
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] border border-border bg-white px-5 py-4 text-center shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
            <p className={`mt-2 text-2xl font-semibold tabular-nums ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Case cards */}
      <div className="space-y-4">
        {cases.map((c) => (
          <div key={c.id} className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-lg font-bold text-brand">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-950">{c.name}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[c.status]}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{c.id} · {c.program} · Submitted {c.submitted}</p>
                </div>
              </div>

              <div className="flex gap-2 sm:shrink-0">
                <button type="button" className="flex items-center gap-1.5 rounded-2xl border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  <Eye className="h-4 w-4" /> Review
                </button>
                <button type="button" className="flex items-center gap-1.5 rounded-2xl border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  <MessageSquare className="h-4 w-4" /> Message
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">Annual income</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-slate-950">{c.income}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">Household size</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">{c.household} people</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Documents</p>
                  <span className="text-xs font-semibold text-slate-600">{c.docsUploaded}/{c.docsNeeded}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div className={`h-full rounded-full ${c.docsUploaded === c.docsNeeded ? "bg-success" : "bg-brand"} ${getProgressWidthClass(c.docsUploaded, c.docsNeeded)}`} />
                </div>
              </div>
            </div>

            {/* Status actions */}
            {c.status !== "Approved" ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                <span className="text-xs font-semibold text-slate-500 self-center">Move to:</span>
                {["Under review", "Approved", "Rejected", "Waitlisted"]
                  .filter((s) => s !== c.status)
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="rounded-full border border-border bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand hover:bg-brand/5 hover:text-brand"
                    >
                      {s}
                    </button>
                  ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </StaffShell>
  );
}

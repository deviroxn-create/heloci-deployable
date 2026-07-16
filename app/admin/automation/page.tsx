import { Zap, Plus, ToggleLeft, ToggleRight, Edit2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";

const rules = [
  {
    id: "RULE-001",
    name: "Auto-assign new applications",
    trigger: "Application submitted",
    action: "Assign to least-loaded staff member",
    enabled: true,
    runs: 248
  },
  {
    id: "RULE-002",
    name: "Document reminder",
    trigger: "Application pending > 3 days",
    action: "Send applicant email: 'Documents needed'",
    enabled: true,
    runs: 92
  },
  {
    id: "RULE-003",
    name: "Approval notification",
    trigger: "Application status → Approved",
    action: "Send approval email + notify case manager",
    enabled: true,
    runs: 76
  },
  {
    id: "RULE-004",
    name: "Rejection email",
    trigger: "Application status → Rejected",
    action: "Send rejection email with next steps",
    enabled: true,
    runs: 27
  },
  {
    id: "RULE-005",
    name: "Weekly digest report",
    trigger: "Every Monday 9am",
    action: "Email admin: weekly application summary",
    enabled: false,
    runs: 12
  }
];

export default function AdminAutomationPage() {
  return (
    <AdminShell
      title="Automation rules"
      description="Configure workflow automations that route applications, trigger emails, and simplify staff handoffs."
      actions={
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New rule
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Active rules", value: "4" },
          { label: "Total rule runs", value: "455" },
          { label: "Emails sent", value: "341" }
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] border border-border bg-white px-5 py-4 text-center shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-950">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Rules */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <div key={rule.id} className={`rounded-[28px] border bg-white p-6 shadow-soft transition ${rule.enabled ? "border-border" : "border-border opacity-60"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${rule.enabled ? "bg-brand/10 text-brand" : "bg-slate-100 text-slate-400"}`}>
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-950">{rule.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${rule.enabled ? "bg-success/10 text-success" : "bg-slate-100 text-slate-500"}`}>
                      {rule.enabled ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1 text-sm text-slate-600">
                    <p><span className="font-semibold text-slate-700">Trigger:</span> {rule.trigger}</p>
                    <p><span className="font-semibold text-slate-700">Action:</span> {rule.action}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400">{rule.runs} runs</span>
                <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white text-slate-600 transition hover:border-brand hover:text-brand" aria-label={`Edit ${rule.name}`}>
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border transition ${rule.enabled ? "border-success/20 bg-success/5 text-success hover:bg-success/10" : "border-border bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
                  aria-label={rule.enabled ? `Disable ${rule.name}` : `Enable ${rule.name}`}
                >
                  {rule.enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New rule CTA */}
      <div className="rounded-[28px] border-2 border-dashed border-border bg-white p-8 text-center shadow-soft">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Plus className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-950">Create a new automation rule</h3>
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">Define custom triggers and actions to automate routing, notifications, and reporting workflows.</p>
        <Button className="mt-5" size="sm">Add rule</Button>
      </div>
    </AdminShell>
  );
}

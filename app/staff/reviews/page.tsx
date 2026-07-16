import { Star, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import { StaffShell } from "@/components/staff/staff-shell";
import { Button } from "@/components/ui/button";

const reviews = [
  {
    id: "REV-001",
    applicationId: "APP-5411",
    applicant: "Carlos Reyes",
    program: "Veteran Housing",
    status: "Complete",
    recommendation: "Approve",
    note: "Applicant meets all income and residency criteria. DD-214 verified. Recommend approval for unit 2B.",
    date: "Jun 23, 2026"
  },
  {
    id: "REV-002",
    applicationId: "APP-5412",
    applicant: "Amara Singh",
    program: "Family Housing",
    status: "Pending",
    recommendation: null,
    note: "",
    date: "Jun 24, 2026"
  },
  {
    id: "REV-003",
    applicationId: "APP-5410",
    applicant: "Lena Fischer",
    program: "Emergency Shelter",
    status: "Complete",
    recommendation: "Approve",
    note: "Emergency need verified by intake team. Household size and income confirmed. Priority placement recommended.",
    date: "Jun 20, 2026"
  }
];

const recommendationStyles: Record<string, string> = {
  Approve: "bg-success/10 text-success",
  Reject: "bg-error/10 text-error",
  Waitlist: "bg-slate-100 text-slate-600"
};

export default function StaffReviewsPage() {
  return (
    <StaffShell
      title="Case reviews"
      description="Submit application reviews, approval notes, and follow-up tasks."
      actions={<Button size="sm">New review</Button>}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Reviews submitted", value: "24", icon: Star },
          { label: "Pending reviews", value: "3", icon: Clock3 },
          { label: "Approvals recommended", value: "18", icon: CheckCircle2 }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-[24px] border border-border bg-white px-5 py-4 text-center shadow-soft">
              <Icon className="mx-auto h-5 w-5 text-brand" />
              <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-950">{item.value}</p>
              <p className="text-xs text-slate-500">{item.label}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-5">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-[28px] border border-border bg-white p-6 shadow-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-lg font-bold text-brand">
                  {review.applicant.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-950">{review.applicant}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${review.status === "Complete" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                      {review.status}
                    </span>
                    {review.recommendation ? (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${recommendationStyles[review.recommendation]}`}>
                        {review.recommendation}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500">{review.id} · {review.applicationId} · {review.program}</p>
                  <p className="text-xs text-slate-400">{review.date}</p>
                </div>
              </div>
            </div>

            {review.status === "Complete" && review.note ? (
              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-500 mb-1.5">Review notes</p>
                <p className="text-sm leading-6 text-slate-700">{review.note}</p>
              </div>
            ) : null}

            {review.status === "Pending" ? (
              <div className="mt-4 space-y-3">
                <textarea
                  rows={3}
                  placeholder="Add review notes for this case…"
                  className="w-full resize-none rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
                  aria-label="Review notes"
                />
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-semibold text-slate-500 self-center">Recommend:</span>
                  <button type="button" className="rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success transition hover:bg-success/20">
                    <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />
                    Approve
                  </button>
                  <button type="button" className="rounded-full bg-error/10 px-3 py-1.5 text-xs font-semibold text-error transition hover:bg-error/20">
                    <XCircle className="inline h-3.5 w-3.5 mr-1" />
                    Reject
                  </button>
                  <button type="button" className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200">
                    Waitlist
                  </button>
                </div>
                <Button size="sm">Submit review</Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </StaffShell>
  );
}

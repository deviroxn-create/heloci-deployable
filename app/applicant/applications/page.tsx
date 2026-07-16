import { ApplicantShell } from "@/components/applicant/applicant-shell";
import { Button } from "@/components/ui/button";

const applications = [
  {
    id: "APP-1123",
    program: "Family Support Program",
    status: "Pending",
    lastUpdate: "Today",
    note: "Awaiting income documentation",
    progress: 60
  },
  {
    id: "APP-1109",
    program: "Veteran Housing",
    status: "Approved",
    lastUpdate: "2 days ago",
    note: "Ready for move-in coordination",
    progress: 100
  }
];

export default function Page() {
  return (
    <ApplicantShell
      title="My applications"
      description="See application progress, timelines, and request updates from your housing team.">
      <div className="space-y-8">
        <div className="grid gap-6 xl:grid-cols-2">
          {applications.map((application) => (
            <article key={application.id} className="rounded-[32px] border border-border bg-white p-8 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-brand">{application.id}</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-950">{application.program}</h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${application.status === "Approved" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                  {application.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">{application.note}</p>
              <div className="mt-6 rounded-3xl bg-slate-100 p-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Progress</span>
                  <span>{application.progress}%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${application.progress}%` }} />
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="outline">View details</Button>
                {application.status !== "Approved" ? <Button>Upload docs</Button> : <Button variant="outline">Contact staff</Button>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </ApplicantShell>
  );
}

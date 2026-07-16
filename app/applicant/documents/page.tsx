import { ApplicantShell } from "@/components/applicant/applicant-shell";
import { Button } from "@/components/ui/button";
import { FileText, UploadCloud, CheckCircle2, AlertTriangle } from "lucide-react";

const documents = [
  { label: "Proof of income", status: "Pending", icon: FileText },
  { label: "Household roster", status: "Uploaded", icon: UploadCloud },
  { label: "Photo ID", status: "Verified", icon: CheckCircle2 },
  { label: "Residency proof", status: "Rejected", icon: AlertTriangle }
];

export default function Page() {
  return (
    <ApplicantShell
      title="Documents"
      description="Keep your required paperwork organized so your application moves forward without delays.">
      <div className="space-y-8">
        <section className="rounded-[32px] bg-white p-8 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-brand">Document upload</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">Complete your application checklist.</h2>
            </div>
            <Button>Upload files</Button>
          </div>
          <div className="mt-8 grid gap-4">
            {documents.map((document) => {
              const Icon = document.icon;
              const statusStyles = {
                Pending: "bg-warning/10 text-warning",
                Uploaded: "bg-brand/10 text-brand",
                Verified: "bg-success/10 text-success",
                Rejected: "bg-error/10 text-error"
              };
              return (
                <div key={document.label} className="flex items-center justify-between gap-4 rounded-[28px] border border-border bg-slate-50 p-5">
                  <div className="flex items-center gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-white text-slate-900 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">{document.label}</p>
                      <p className="text-sm text-slate-600">Status: {document.status}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusStyles[document.status as keyof typeof statusStyles]}`}>
                    {document.status}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[32px] bg-slate-50 p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.24em] text-brand">How it works</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] bg-white p-5">
              <p className="text-sm font-semibold text-slate-950">Accepted file types</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">PDF, JPG, PNG, DOCX. Keep uploads under 12MB per file.</p>
            </div>
            <div className="rounded-[28px] bg-white p-5">
              <p className="text-sm font-semibold text-slate-950">What happens next</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">Staff reviews uploads within 24 hours and sends any follow-up requests directly to your inbox.</p>
            </div>
          </div>
        </section>
      </div>
    </ApplicantShell>
  );
}

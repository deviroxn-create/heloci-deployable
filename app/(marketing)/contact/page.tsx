import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/shared/page-shell";
import { Mail, Phone, MessageSquare } from "lucide-react";

export default function Page() {
  return (
    <PageShell>
      <section className="rounded-[32px] bg-white px-6 py-10 shadow-soft md:px-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Contact support</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              Help is always within reach.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
              Reach Heloci staff for questions about properties, applications, documentation, or eligibility. Our team is here to guide you every step of the way.
            </p>
            <Button className="mt-8 min-w-[170px]">Send a message</Button>
          </div>
          <div className="space-y-6 rounded-[32px] border border-border bg-slate-50 p-8 shadow-sm">
            <div className="rounded-[28px] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-brand">
                <Mail className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-950">Email</p>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">support@heloci.ngo</p>
            </div>
            <div className="rounded-[28px] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-brand">
                <Phone className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-950">Phone</p>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">(555) 123-4567</p>
            </div>
            <div className="rounded-[28px] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-brand">
                <MessageSquare className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-950">Visit help center</p>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">Access FAQs, application guides, and program resources anytime.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          {
            title: "Quick support",
            detail: "Every inquiry is prioritized so applicants and staff get timely guidance when it matters most."
          },
          {
            title: "Staff assistance",
            detail: "Trained NGO workers review your case and help you prepare a complete application package."
          },
          {
            title: "Program clarity",
            detail: "We help you understand eligibility, required documents, and next steps before you submit anything."
          }
        ].map((item) => (
          <div key={item.title} className="rounded-[32px] border border-border bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-slate-950">{item.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{item.detail}</p>
          </div>
        ))}
      </section>
    </PageShell>
  );
}

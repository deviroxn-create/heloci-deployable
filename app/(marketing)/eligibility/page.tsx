import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/shared/page-shell";
import { ShieldCheck, FileText, Clock3 } from "lucide-react";

const criteria = [
  {
    title: "Household qualifications",
    description: "Income limits, household size, veteran status, and local program priorities determine the right match for support.",
    icon: ShieldCheck
  },
  {
    title: "Document checklist",
    description: "Clear requirements for ID, income proofs, residency, and case notes reduce uncertainty before applying.",
    icon: FileText
  },
  {
    title: "Application timeline",
    description: "Automated updates keep you informed at every step from review to approval or follow-up requests.",
    icon: Clock3
  }
];

export default function Page() {
  return (
    <PageShell>
      <section className="rounded-[32px] bg-white px-6 py-10 shadow-soft md:px-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_0.85fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Eligibility checker</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              Know where you stand before you apply.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
              Heloci helps you understand which programs you qualify for, what documents are needed, and how to move forward with confidence.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild className="min-w-[170px]">
                <Link href="/profile">Start eligibility check</Link>
              </Button>
              <Button asChild variant="outline" className="min-w-[170px]">
                <Link href="/properties">Browse support programs</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-[32px] border border-border bg-slate-50 p-8 shadow-sm">
            <div className="space-y-5">
              {criteria.map((item) => (
                <div key={item.title} className="rounded-[28px] bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3 text-brand">
                    <item.icon className="h-5 w-5" />
                    <p className="text-base font-semibold text-slate-950">{item.title}</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          {
            title: "Income bands",
            details: "We display the correct threshold for your household so you can apply only where you're likely to qualify."
          },
          {
            title: "Document clarity",
            details: "Upload and track paperwork in one place so missing document requests feel simple, not stressful."
          },
          {
            title: "Program matching",
            details: "Heloci matches your profile with family housing, veteran assistance, and emergency shelter options."
          }
        ].map((item) => (
          <div key={item.title} className="rounded-[32px] border border-border bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-slate-950">{item.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{item.details}</p>
          </div>
        ))}
      </section>
    </PageShell>
  );
}

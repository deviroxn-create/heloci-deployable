import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/shared/page-shell";
import { Users, Heart, Sparkles, ShieldCheck } from "lucide-react";

const values = [
  {
    title: "Mission-driven",
    description: "Heloci was built to connect vulnerable families with safe, supported housing options and expert NGO guidance.",
    icon: Heart
  },
  {
    title: "Trusted support",
    description: "We combine AI guidance, caseworker communication, and clear workflows so every applicant feels supported.",
    icon: ShieldCheck
  },
  {
    title: "Community impact",
    description: "Our platform is designed to reduce application friction, improve transparency, and speed help to the people who need it most.",
    icon: Users
  }
];

export default function Page() {
  return (
    <PageShell>
      <section className="rounded-[32px] bg-white px-6 py-10 shadow-soft md:px-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">About Heloci</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              Building housing support that feels calm, clear, and trusted.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
              Heloci brings together verified housing listings, eligibility guidance, and NGO workflows so applicants can move forward with confidence.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button className="min-w-[170px]">Browse programs</Button>
              <Button variant="outline" className="min-w-[170px]">Meet our team</Button>
            </div>
          </div>
          <div className="rounded-[32px] border border-border bg-slate-50 p-8 shadow-sm">
            <div className="rounded-[28px] bg-white p-6 shadow-sm">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-brand/10 text-brand">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="mt-5 text-sm text-slate-600">Our platform is built for applicants, staff, and admins working together to place people in safe homes.</p>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-[28px] border border-border bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-950">Founded for impact</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">Heloci started with the idea that housing support should be accessible, personalized, and compassionate.</p>
              </div>
              <div className="rounded-[28px] border border-border bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-950">Designed for clarity</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">Every workflow is structured to reduce confusion and help applicants take the next best step.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {values.map((item) => (
          <div key={item.title} className="rounded-[32px] border border-border bg-white p-6 shadow-soft">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-brand/10 text-brand">
              <item.icon className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-950">{item.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
          </div>
        ))}
      </section>
    </PageShell>
  );
}

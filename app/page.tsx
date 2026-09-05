import { ArrowRight, FileText, Home, MessageSquare, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma/client";
import { HERO_IMAGES, MISSION_IMAGE } from "@/lib/landing-images";
import { PageShell } from "@/components/shared/page-shell";
import { PropertyCard } from "@/components/property/property-card";
import { HeroCrossfade } from "@/components/marketing/hero-crossfade";
import { ResilientImage } from "@/components/marketing/resilient-image";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Explore",
    description: "Browse available housing opportunities and find a place that fits your needs.",
    icon: Home
  },
  {
    title: "Check eligibility",
    description: "Answer a few questions to understand which support programs may fit your situation.",
    icon: FileText
  },
  {
    title: "Apply with support",
    description: "Submit your application, share documents, and stay connected throughout the process.",
    icon: ShieldCheck
  }
];

const faqs = [
  {
    question: "Who qualifies for Heloci housing support?",
    answer: "Applicants who meet local income guidelines, household eligibility, and priority criteria can apply. Heloci helps identify programs that match your family size, veteran status, or emergency need."
  },
  {
    question: "What documents are required to apply?",
    answer: "Common documents include ID, income verification, household roster, and residency proof. The application wizard shows exactly what is needed for your program."
  },
  {
    question: "How long does approval take?",
    answer: "Approval timelines vary by program. Heloci keeps you informed with updates and staff messages so you know what comes next."
  }
];

export default async function HomePage() {
  const properties = await prisma.property.findMany({
    where: { status: "AVAILABLE" },
    include: { images: true },
    take: 4
  });

  return (
    <PageShell>
      <section className="relative isolate min-h-[560px] overflow-hidden rounded-[32px] shadow-soft md:min-h-[620px]">
        <HeroCrossfade images={HERO_IMAGES} />
        <div className="relative z-10 flex min-h-[560px] items-end px-6 py-10 md:min-h-[620px] md:px-12 md:py-14">
          <div className="max-w-2xl text-white">
            <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
              Housing support with dignity
            </p>
            <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight md:text-6xl">
              Find a home and the support to move forward.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/90 md:text-lg">
              Explore housing opportunities, understand your options, and apply with clear guidance from Heloci.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="md" className="!bg-white !text-brand hover:!bg-slate-100">
                <Link href="/check-eligibility">Check eligibility</Link>
              </Button>
              <Button asChild variant="outline" size="md" className="border-white/70 !bg-white/10 !text-white hover:!bg-white/20">
                <Link href="/properties">Explore housing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6" aria-labelledby="housing-opportunities-heading">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Housing opportunities</p>
            <h2 id="housing-opportunities-heading" className="mt-3 text-3xl font-semibold text-slate-950">Available homes and supportive housing.</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Explore current housing opportunities published through Heloci.</p>
          </div>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/properties">View all housing</Link>
          </Button>
        </div>
        {properties.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-4">
            {properties.map((property) => <PropertyCard key={property.id} property={property} />)}
          </div>
        ) : (
          <div className="rounded-[28px] border border-border bg-white px-6 py-12 text-center shadow-soft">
            <p className="text-base text-slate-600">Housing opportunities will appear here once properties are published.</p>
          </div>
        )}
      </section>

      <section className="rounded-[32px] bg-white p-8 shadow-soft md:p-10" aria-labelledby="how-it-works-heading">
        <div className="flex items-start gap-3 text-brand">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-3xl bg-brand/10">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.24em]">How Heloci works</p>
            <h2 id="how-it-works-heading" className="mt-3 text-3xl font-semibold text-slate-950">A clear path from searching to applying.</h2>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-[28px] border border-border bg-slate-50 p-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-white text-brand shadow-sm">
                <step.icon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-sm font-semibold text-slate-950">Step {index + 1}</p>
              <h3 className="mt-3 text-xl font-semibold text-slate-950">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 overflow-hidden rounded-[32px] bg-white shadow-soft lg:grid-cols-[0.9fr_1.1fr]" aria-labelledby="mission-heading">
        <div className="relative min-h-[320px] bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]">
          <ResilientImage src={MISSION_IMAGE.src} alt={MISSION_IMAGE.alt} fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" priority={false} />
        </div>
        <div className="flex flex-col justify-center p-8 md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Our mission</p>
          <h2 id="mission-heading" className="mt-4 text-3xl font-semibold text-slate-950">Housing support should feel human.</h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
            Heloci brings housing opportunities, eligibility guidance, applications, and people together in one clear place so you can take the next step with confidence.
          </p>
          <Link href="/about" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brandHover">
            Learn about Heloci <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="rounded-[32px] bg-white p-8 shadow-soft md:p-10" aria-labelledby="faq-heading">
        <div className="flex items-start gap-3 text-brand">
          <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-3xl bg-brand/10">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.24em]">FAQ</p>
            <h2 id="faq-heading" className="mt-3 text-3xl font-semibold text-slate-950">Questions families ask most.</h2>
          </div>
        </div>
        <div className="mt-8 space-y-4">
          {faqs.map((item) => (
            <details key={item.question} className="group rounded-[28px] border border-border bg-slate-50 p-5 transition hover:border-brand">
              <summary className="cursor-pointer list-none text-base font-semibold text-slate-950 marker:hidden">{item.question}</summary>
              <p className="mt-4 text-sm leading-7 text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] bg-brand p-8 text-white shadow-soft md:p-10">
        <p className="text-sm uppercase tracking-[0.24em] text-white/80">Take the next step</p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold">Start with a clearer understanding of your housing options.</h2>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/80">Answer a few questions and get guided support for the next part of your housing journey.</p>
        <Button asChild className="mt-8 !bg-white !text-brand hover:!bg-slate-100">
          <Link href="/check-eligibility">Check your eligibility</Link>
        </Button>
      </section>
    </PageShell>
  );
}

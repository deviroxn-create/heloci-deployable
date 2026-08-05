"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Star, Users, MapPin, MessageSquare, Home, FileText } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import FeaturedPrograms from "@/components/FeaturedPrograms";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Search housing",
    description: "Explore verified properties with supportive services, safety ratings, and local neighborhood insights.",
    icon: Home
  },
  {
    title: "Check eligibility",
    description: "Answer a few questions to see what programs you qualify for and what documents are required.",
    icon: FileText
  },
  {
    title: "Apply securely",
    description: "Submit your application, upload paperwork, and track approvals through a guided workflow.",
    icon: ShieldCheck
  }
];

const testimonials = [
  {
    name: "Maya R.",
    role: "Single mother, program applicant",
    quote: "Heloci made a stressful process feel manageable. I found a safe apartment with support and knew exactly what documents to submit.",
    rating: 5
  },
  {
    name: "Jorge T.",
    role: "Veteran applicant",
    quote: "The eligibility checker gave me confidence. Staff reached out quickly, and the AI assistant helped me understand every step.",
    rating: 5
  },
  {
    name: "Aisha L.",
    role: "Family support caseworker",
    quote: "The platform keeps applications organized and gives families a calm, clear process from first search to approval.",
    rating: 5
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
    answer: "Approval timelines vary by program, but Heloci keeps you informed with automated updates and staff messages so you know when the next decision is coming."
  }
];

export default function HomePage() {
  return (
    <PageShell>
      <section className="overflow-hidden rounded-[32px] bg-white px-6 py-10 shadow-soft md:px-10 md:py-14">
        <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[1.25fr_0.9fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-brand">
              Trusted housing assistance
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              Find safe, affordable housing with confidence.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              Search verified housing opportunities, check eligibility, and apply with confidence using Heloci’s AI-powered assistance and NGO support network.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild className="min-w-[170px]" size="md">
                <Link href="/check-eligibility">Check Eligibility</Link>
              </Button>
              <Button asChild variant="outline" className="min-w-[170px]" size="md">
                <Link href="/programs">Browse Programs</Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Verified Listings", icon: ShieldCheck },
                { label: "Secure Applications", icon: Sparkles },
                { label: "AI Guidance", icon: MessageSquare }
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-border bg-slate-50 px-5 py-4">
                  <div className="flex items-center gap-3 text-slate-900">
                    <item.icon className="h-5 w-5 text-brand" />
                    <span className="text-sm font-semibold">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="relative">
            <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-gradient-to-br from-brand/10 via-transparent to-white opacity-70" />
            <div className="relative overflow-hidden rounded-[32px] border border-border bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 shadow-soft">
              <div className="grid gap-5">
                <div className="rounded-[24px] bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Active case</p>
                      <h2 className="mt-2 text-xl font-semibold text-slate-950">Family housing near schools</h2>
                    </div>
                    <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-success">Approved</span>
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-brand/5 px-4 py-3 text-sm text-slate-700">3 beds</div>
                    <div className="rounded-3xl bg-brand/5 px-4 py-3 text-sm text-slate-700">1.2 miles to transit</div>
                  </div>
                </div>

                <div className="rounded-[24px] bg-slate-950 p-5 text-white shadow-soft">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">AI assistant preview</p>
                  <div className="mt-4 space-y-4">
                    <div className="rounded-3xl bg-slate-900 px-4 py-4">
                      <p className="text-sm leading-7 text-slate-200">“What documents will I need for emergency housing support?”</p>
                    </div>
                    <div className="rounded-3xl bg-slate-800 px-4 py-4">
                      <p className="text-sm leading-7 text-slate-200">“Show me verified properties under $900 near schools.”</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3 text-slate-700">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-3xl bg-brand/10 text-brand">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em]">Nearby services</p>
                      <p className="mt-1 text-base font-semibold text-slate-950">Schools, transit, clinics</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5 }} className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Featured programs</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">Programs you can apply to today.</h2>
          </div>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/programs">View all programs</Link>
          </Button>
        </div>

        <FeaturedPrograms />
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: 0.1 }} className="grid gap-8 lg:grid-cols-[0.95fr_0.9fr]">
        <div className="rounded-[32px] bg-white p-8 shadow-soft">
          <div className="flex items-center gap-3 text-brand">
            <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-brand/10">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.24em]">How Heloci works</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">A guided housing workflow for every applicant.</h2>
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
        </div>

        <div className="rounded-[32px] bg-gradient-to-br from-brand/10 via-white to-slate-50 p-8 shadow-soft">
          <div className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">AI eligibility assistant</p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">Get quick answers before you apply.</h3>
              </div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-brand text-white">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {[
                "Am I eligible for family housing?",
                "What documents do I need?",
                "Find housing near schools."
              ].map((prompt) => (
                <div key={prompt} className="rounded-3xl border border-border bg-slate-50 px-4 py-4 text-sm text-slate-700">
                  {prompt}
                </div>
              ))}
            </div>
            <Button asChild className="mt-6 w-full">
              <Link href="/check-eligibility">Try AI assistant</Link>
            </Button>
          </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: 0.2 }} className="rounded-[32px] bg-white p-8 shadow-soft">
        <div className="md:flex md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Location intelligence</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">See supportive services near every property.</h2>
          </div>
          <Button asChild variant="outline" className="mt-6 md:mt-0">
            <Link href="/programs">View programs</Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
          <div className="h-[420px] rounded-[28px] bg-slate-950/5 p-6">
            <div className="h-full rounded-[28px] bg-[radial-gradient(circle_at_top,_rgba(0,61,184,0.15),transparent_40%),linear-gradient(180deg,_#ffffff_0%,_#f8faff_100%)] p-6 text-slate-900">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Portland, OR</span>
                <span>6 listings</span>
              </div>
              <div className="mt-6 h-full rounded-[24px] bg-slate-100 shadow-inner" />
            </div>
          </div>
          <div className="grid gap-4">
            {[
              "Schools",
              "Transit",
              "Hospitals",
              "Grocery access"
            ].map((label) => (
              <div key={label} className="rounded-[28px] border border-border bg-slate-50 px-5 py-4">
                <p className="text-sm font-semibold text-slate-950">{label}</p>
                <p className="mt-2 text-sm text-slate-600">Trusted neighborhood services appear on every map summary.</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: 0.3 }} className="grid gap-6 lg:grid-cols-3">
        {testimonials.map((testimonial) => (
          <article key={testimonial.name} className="rounded-[32px] border border-border bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-slate-950">{testimonial.name}</p>
                <p className="text-sm text-slate-500">{testimonial.role}</p>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">
                <Star className="h-4 w-4" /> {testimonial.rating}.0
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-600">“{testimonial.quote}”</p>
          </article>
        ))}
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: 0.4 }} className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] bg-white p-8 shadow-soft">
          <div className="flex items-center gap-3 text-brand">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-brand/10">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.24em]">FAQ</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">Questions families ask most.</h2>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            {faqs.map((item) => (
              <details key={item.question} className="group rounded-[28px] border border-border bg-slate-50 p-5 transition hover:border-brand">
                <summary className="cursor-pointer text-base font-semibold text-slate-950 list-none marker:hidden">
                  {item.question}
                </summary>
                <p className="mt-4 text-sm leading-7 text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] bg-brand text-white p-10 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-white/15 text-white">
              <ArrowRight className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-white/80">Need help finding housing?</p>
              <h3 className="mt-3 text-3xl font-semibold">Start your application with guided support.</h3>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/80">Heloci coordinates your application, documents, and staff communication so you never feel alone in the process.</p>
          <Button asChild className="mt-8 w-full bg-white text-brand hover:bg-slate-100">
            <Link href="/check-eligibility">Check Your Eligibility</Link>
          </Button>
        </div>
      </motion.section>
    </PageShell>
  );
}

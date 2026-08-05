import { prisma } from "@/lib/prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { getProgramMatches } from "@/lib/matching/engine";
import Link from "next/link";
import { ArrowRight, Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  searchParams?: Promise<{ goal?: string; category?: string; org?: string; q?: string; page?: string }>;
};

function getProgramStatus(deadline?: Date | null) {
  if (!deadline) return "Open now";
  return new Date(deadline) > new Date() ? "Open now" : "Closed";
}

export default async function Page({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const { goal, category, org, q } = resolvedSearchParams || {};
  const where: any = {
    status: "active",
    isArchived: false,
    isPublic: true
  };

  if (goal) where.housingGoal = goal;
  if (category) where.category = category;
  if (org) where.organization = { slug: org };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { housingGoal: { contains: q, mode: "insensitive" } }
    ];
  }

  const programs = await prisma.program.findMany({
    where,
    orderBy: [{ priority: "desc" }, { publishedAt: "desc" }],
    include: { organization: { select: { id: true, name: true, slug: true } } },
    take: 50
  });

  const user = await getCurrentUser();
  const scoreMap: Record<string, number> = {};

  if (user) {
    try {
      const matches = await getProgramMatches(user.id);
      for (const hit of [...matches.eligible, ...matches.nearlyEligible]) {
        scoreMap[hit.programSlug] = hit.score;
      }
    } catch {
      // ignore matching errors — still show programs
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] bg-white p-8 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#006AFF]">Program discovery</p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-950">Browse housing opportunities without creating an application.</h1>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Explore verified programs, compare housing goals, and use eligibility as guidance before you apply.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/check-eligibility">Check eligibility</Link>
              </Button>
              <Button asChild>
                <Link href="/apply">Start application</Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { title: "Browse without signing in", description: "Every visitor can review public programs and understand options first." },
              { title: "Guided next steps", description: "Each program card points you to the most helpful action for your situation." },
              { title: "Eligibility is advisory", description: "You can continue to apply even when more review is needed." }
            ].map((item) => (
              <div key={item.title} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">{item.title}</p>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] bg-white p-6 shadow-soft">
          <form method="get" className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
            <input name="q" defaultValue={q ?? ""} placeholder="Search by program name or housing goal" className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3" />
            <select name="goal" aria-label="Filter by goal" defaultValue={goal ?? ""} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
              <option value="">All goals</option>
              <option value="Affordable Rent">Affordable Rent</option>
              <option value="Buy My First Home">Buy My First Home</option>
              <option value="Emergency Housing">Emergency Housing</option>
              <option value="Veteran Housing">Veteran Housing</option>
            </select>
            <select name="category" aria-label="Filter by category" defaultValue={category ?? ""} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
              <option value="">All categories</option>
              <option value="Government">Government</option>
              <option value="NGO">NGO</option>
              <option value="Veterans">Veterans</option>
              <option value="Home Buyer">Home Buyer</option>
            </select>
            <select name="org" aria-label="Filter by organization" defaultValue={org ?? ""} className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
              <option value="">All organizations</option>
              <option value="hud">HUD</option>
              <option value="habitat">Habitat</option>
              <option value="city-of-los-angeles">City of Los Angeles</option>
            </select>
            <Button type="submit">Filter</Button>
          </form>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          {programs.map((program) => (
            <Card key={program.id} className="rounded-[24px] p-6 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getProgramStatus(program.deadline as Date | null) === "Open now" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                      {getProgramStatus(program.deadline as Date | null)}
                    </span>
                    {program.category ? <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">{program.category}</span> : null}
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-slate-950">{program.name}</h2>
                  {program.organization ? <p className="mt-1 text-sm text-slate-600">{program.organization.name}</p> : null}
                  {program.housingGoal ? <p className="mt-2 text-sm text-slate-500">Housing goal: {program.housingGoal}</p> : null}
                  {program.summary ? <p className="mt-3 text-sm leading-7 text-slate-600">{program.summary}</p> : null}
                </div>
                {scoreMap[program.slug] !== undefined ? (
                  <div className="rounded-2xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">Match score {scoreMap[program.slug]}</div>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link href={`/programs/${program.slug}`}>
                    <span className="flex items-center gap-2">
                      <Compass className="h-4 w-4" /> View details
                    </span>
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/eligibility/assistant?program=${program.slug}`}>
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> Check eligibility
                    </span>
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}

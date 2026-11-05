import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Home, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/shared/page-shell";
import { PropertyCard } from "@/components/property/property-card";
import { ResilientImage } from "@/components/marketing/resilient-image";
import { HERO_IMAGES } from "@/lib/landing-images";
import { listPublicProperties } from "@/lib/properties/public-property.service";

export default async function PropertiesLandingPage() {
  const [rentals, homesForSale] = await Promise.all([
    listPublicProperties({ listingType: "RENT", limit: 3 }),
    listPublicProperties({ listingType: "SALE", limit: 3 })
  ]);
  const featuredProperties = [...rentals, ...homesForSale];

  return (
    <PageShell>
      <section className="relative isolate overflow-hidden rounded-[32px] bg-slate-950 px-6 py-12 shadow-soft md:px-12 md:py-16">
        <div className="absolute inset-0 -z-10 opacity-35">
          <ResilientImage src={HERO_IMAGES[0].src} alt="" fill sizes="100vw" className="object-cover" priority />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/30" />
        <div className="max-w-3xl text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-200">HELOCI housing discovery</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">Find a place to call home.</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
            Discover housing opportunities with clear details and supportive guidance for your next step.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/properties/rent" className="inline-flex min-h-12 items-center rounded-full bg-white px-6 text-sm font-semibold text-brand transition hover:bg-blue-50">
              Explore rentals <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/properties/buy" className="inline-flex min-h-12 items-center rounded-full border border-white/60 bg-white/10 px-6 text-sm font-semibold text-white transition hover:bg-white/20">
              Explore homes for sale <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="choose-journey" className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Choose your next step</p>
          <h2 id="choose-journey" className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Rent or buy—with the right details up front.</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="group relative isolate flex min-h-[320px] flex-col justify-end overflow-hidden rounded-[28px] bg-slate-900 p-7 text-white shadow-card md:p-9">
            <Image src={HERO_IMAGES[1].src} alt="" fill sizes="(max-width: 1024px) 100vw, 50vw" className="-z-20 object-cover transition duration-500 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent" />
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold tracking-wider text-white backdrop-blur-sm">
              <KeyRound aria-hidden="true" className="h-4 w-4" /> RENT A HOME
            </span>
            <h3 className="text-2xl font-semibold md:text-3xl">A rental that fits your next chapter.</h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-200">Browse available apartments and houses, compare monthly rent, and review rental details.</p>
            <Link href="/properties/rent" className="mt-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-blue-50">
              Rent a home <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </article>
          <article className="group relative isolate flex min-h-[320px] flex-col justify-end overflow-hidden rounded-[28px] bg-slate-900 p-7 text-white shadow-card md:p-9">
            <Image src={HERO_IMAGES[3].src} alt="" fill sizes="(max-width: 1024px) 100vw, 50vw" className="-z-20 object-cover transition duration-500 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent" />
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold tracking-wider text-white backdrop-blur-sm">
              <Home aria-hidden="true" className="h-4 w-4" /> BUY A HOME
            </span>
            <h3 className="text-2xl font-semibold md:text-3xl">Explore homes available to purchase.</h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-200">See total sale prices and property details, then contact HELOCI for guidance on next steps.</p>
            <Link href="/properties/buy" className="mt-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-blue-50">
              Buy a home <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </article>
        </div>
      </section>

      {featuredProperties.length > 0 && (
        <section aria-labelledby="featured-properties">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Featured opportunities</p>
              <h2 id="featured-properties" className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">A few places to get started.</h2>
            </div>
            <Link href="/properties/rent" className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brandHover">
              Explore rentals <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {featuredProperties.map((property) => <PropertyCard key={property.id} property={property} />)}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild><Link href="/properties/rent">View all rentals</Link></Button>
            <Button asChild variant="outline"><Link href="/properties/buy">View homes for sale</Link></Button>
          </div>
        </section>
      )}

      <section id="how-it-works" className="rounded-[32px] bg-white p-7 shadow-soft md:p-10" aria-labelledby="discovery-steps">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">How it works</p>
        <h2 id="discovery-steps" className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Clear choices, supportive next steps.</h2>
        <div className="mt-7 grid gap-6 md:grid-cols-3">
          {[
            { title: "Choose rent or buy", description: "Start with the type of housing opportunity you are looking for.", icon: Home },
            { title: "Review property details", description: "Compare pricing, location, and the information available for each property.", icon: CheckCircle2 },
            { title: "Get guidance", description: "Rental seekers can check eligibility. For purchase questions, contact HELOCI for next steps.", icon: ShieldCheck }
          ].map(({ title, description, icon: Icon }, index) => (
            <div key={title} className="rounded-2xl border border-border bg-slate-50 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                {index + 1}
              </div>
              <Icon aria-hidden="true" className="mt-4 h-5 w-5 text-brand" />
              <h3 className="mt-3 font-semibold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild><Link href="/properties">Browse all properties</Link></Button>
          <Button asChild variant="outline"><Link href="/eligibility">Check rental eligibility</Link></Button>
        </div>
      </section>
    </PageShell>
  );
}

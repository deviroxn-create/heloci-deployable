import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/shared/page-shell";
import { PropertyCard } from "@/components/property/property-card";
import { MapPin, ShieldCheck, Heart } from "lucide-react";
import type { Property } from "@/types/property";

const sampleProperties: Property[] = [
  {
    id: "marketing-1",
    title: "Willow Creek Family Unit",
    description: "Verified housing for families with access to supportive community services.",
    address: "34 Willow St",
    city: "Portland",
    state: "OR",
    zip: "97209",
    latitude: 45.5244,
    longitude: -122.6699,
    rent: 760,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 860,
    amenities: ["Transit near", "Caseworker support", "Community kitchen"],
    specialOffers: ["Supportive services included"],
    availabilityCount: 1,
    status: "Available",
    units: [{ id: "marketing-1-unit", beds: 2, price: 760, available: true }],
    images: []
  },
  {
    id: "marketing-2",
    title: "Horizon Supportive Home",
    description: "Private apartments with eligibility guidance and secure application support.",
    address: "118 Harbor Blvd",
    city: "Seattle",
    state: "WA",
    zip: "98101",
    latitude: 47.6062,
    longitude: -122.3321,
    rent: 820,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1040,
    amenities: ["School access", "Medical shuttle", "Job referrals"],
    specialOffers: ["Flexible move-in support"],
    availabilityCount: 1,
    status: "Available",
    units: [{ id: "marketing-2-unit", beds: 3, price: 820, available: true }],
    images: []
  },
  {
    id: "marketing-3",
    title: "Oak Grove Transitional Housing",
    description: "Short-term housing with fast approval decisions and document checklists.",
    address: "221 Oak Grove Rd",
    city: "Austin",
    state: "TX",
    zip: "78701",
    latitude: 30.2672,
    longitude: -97.7431,
    rent: 690,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 720,
    amenities: ["Veteran support", "Mental health resources", "Transit access"],
    specialOffers: ["Rapid approval support"],
    availabilityCount: 1,
    status: "Available",
    units: [{ id: "marketing-3-unit", beds: 1, price: 690, available: true }],
    images: []
  }
];

export default function Page() {
  return (
    <PageShell>
      <section className="rounded-[32px] bg-white px-6 py-10 shadow-soft md:px-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Available housing</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              Supportive homes you can apply for today.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
              Browse verified properties designed for families, veterans, and individuals seeking managed housing support with NGO-guided applications.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild className="min-w-[170px]">
                <Link href="#featured-listings">Explore listings</Link>
              </Button>
              <Button asChild variant="outline" className="min-w-[170px]">
                <Link href="/eligibility">Check eligibility</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 rounded-[32px] bg-brand/10 p-6 text-slate-950 shadow-soft">
            <div className="rounded-[28px] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 text-brand">
                <MapPin className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-[0.24em]">Neighborhood insights</p>
              </div>
              <p className="mt-4 text-sm text-slate-600">Find homes close to schools, transit, clinics, and trusted services tailored to your support needs.</p>
            </div>
            <div className="rounded-[28px] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 text-brand">
                <ShieldCheck className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-[0.24em]">Verified support</p>
              </div>
              <p className="mt-4 text-sm text-slate-600">Every listing is reviewed for safety and program compliance before it reaches your search results.</p>
            </div>
            <div className="rounded-[28px] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 text-brand">
                <Heart className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-[0.24em]">Applicant-first design</p>
              </div>
              <p className="mt-4 text-sm text-slate-600">We keep the experience calm, clear, and easy so families can focus on getting support faster.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="featured-listings" className="rounded-[32px] bg-slate-50 p-6 shadow-soft md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Featured properties</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">Homes ready for supportive occupancy.</h2>
          </div>
          <Button variant="outline">View all homes</Button>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {sampleProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>
    </PageShell>
  );
}

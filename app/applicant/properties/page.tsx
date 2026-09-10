"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Home, Loader2 } from "lucide-react";
import { ApplicantShell } from "@/components/applicant/applicant-shell";
import { ResilientImage } from "@/components/marketing/resilient-image";
import { Button } from "@/components/ui/button";

interface PropertySummary {
  id: string;
  title: string;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  rent: number;
  images: Array<{ id: string; url: string; altText: string | null }>;
}

interface ProgramProperties {
  applicationId: string;
  program: { id: string; name: string; slug: string };
  properties: Array<{ programPropertyId: string; property: PropertySummary }>;
}

export default function ApplicantPropertiesPage() {
  const [programs, setPrograms] = useState<ProgramProperties[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/applicant/properties")
      .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
      .then(({ ok, body }) => {
        if (!ok) throw new Error(body.error || "Unable to load available properties.");
        setPrograms(body.programs ?? []);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  const propertyCount = programs.reduce((total, program) => total + program.properties.length, 0);

  return (
    <ApplicantShell
      title="Available properties"
      description="Browse properties currently available through your approved housing programs."
    >
      {loading ? (
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
          Loading approved-program properties…
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      ) : propertyCount === 0 ? (
        <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <Home className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-4 text-xl font-semibold text-slate-950">No properties are available yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-slate-600">
            Your approved program does not have available properties published right now. Check back as inventory is added.
          </p>
          <Button asChild variant="outline" className="mt-6"><Link href="/applicant/applications">View my applications</Link></Button>
        </div>
      ) : (
        <div className="space-y-8">
          {programs.map((program) => (
            <section key={program.applicationId}>
              <div className="mb-5 flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Approved program</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">{program.program.name}</h2>
                </div>
                <p className="text-sm text-slate-500">{program.properties.length} {program.properties.length === 1 ? "property" : "properties"} available</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {program.properties.map(({ programPropertyId, property }) => (
                  <article key={programPropertyId} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="aspect-[4/3] bg-slate-100">
                      {property.images[0] ? <ResilientImage src={property.images[0].url} alt={property.images[0].altText || `${property.title} housing`} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300"><Home className="h-10 w-10" /></div>}
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-slate-950">{property.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{property.city}, {property.state}</p>
                      <p className="mt-3 text-sm text-slate-600">{property.bedrooms} beds · {property.bathrooms} baths · {property.sqft.toLocaleString()} sqft</p>
                      <p className="mt-3 font-semibold text-slate-950">${property.rent.toLocaleString()}/mo</p>
                      <Button asChild className="mt-5 w-full"><Link href={`/applicant/properties/${programPropertyId}?applicationId=${encodeURIComponent(program.applicationId)}`}>View property <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </ApplicantShell>
  );
}
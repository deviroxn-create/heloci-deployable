"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Heart, Home, Loader2, MapPin } from "lucide-react";
import { ApplicantShell } from "@/components/applicant/applicant-shell";
import { ResilientImage } from "@/components/marketing/resilient-image";
import { Button } from "@/components/ui/button";

interface PropertyDetails {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  rent: number;
  rentMax: number | null;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  amenities: string[];
  images: Array<{ id: string; url: string; altText: string | null }>;
  units: Array<{ id: string; beds: number; price: number; available: boolean }>;
}

interface DiscoveryProgram {
  applicationId: string;
  program: { name: string };
  properties: Array<{ programPropertyId: string; property: PropertyDetails }>;
}

type InterestStatus = "INTERESTED" | "WITHDRAWN" | null;

export default function ApplicantPropertyDetailPage({ params, searchParams }: { params: Promise<{ programPropertyId: string }>; searchParams: Promise<{ applicationId?: string }> }) {
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [programName, setProgramName] = useState("");
  const [interestStatus, setInterestStatus] = useState<InterestStatus>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [programPropertyId, setProgramPropertyId] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([params, searchParams]).then(([{ programPropertyId: id }, { applicationId }]) => {
      if (!applicationId) throw new Error("Unable to determine the approved application for this property.");
      setProgramPropertyId(id);
      return Promise.all([
        fetch("/api/applicant/properties"),
        fetch(`/api/applicant/properties/${id}/interest?applicationId=${encodeURIComponent(applicationId)}`)
      ]).then(async ([discoveryResponse, interestResponse]) => {
        const discovery = await discoveryResponse.json();
        const interest = await interestResponse.json();
        if (!discoveryResponse.ok) throw new Error(discovery.error || "Unable to load this property.");
        if (!interestResponse.ok) throw new Error(interest.error || "Unable to load interest status.");

        for (const program of discovery.programs as DiscoveryProgram[]) {
          const match = program.properties.find((item) => item.programPropertyId === id);
          if (match) {
            setProperty(match.property);
            setProgramName(program.program.name);
            break;
          }
        }
        setInterestStatus(interest.interest?.status ?? null);
      }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
    });
  }, [params, searchParams]);

  async function changeInterest() {
    if (!programPropertyId) return;
    setUpdating(true);
    const method = interestStatus === "INTERESTED" ? "DELETE" : "POST";
    try {
      const applicationId = new URLSearchParams(window.location.search).get("applicationId");
      if (!applicationId) throw new Error("Unable to determine the approved application for this property.");
      const response = await fetch(`/api/applicant/properties/${programPropertyId}/interest?applicationId=${encodeURIComponent(applicationId)}`, { method });
      const body = response.status === 204 ? null : await response.json();
      if (!response.ok) throw new Error(body?.error || "Unable to update your interest.");
      setInterestStatus(method === "POST" ? "INTERESTED" : "WITHDRAWN");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update your interest.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <ApplicantShell title="Property details" description="Review a property available through your approved program.">
      {loading ? (
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm"><Loader2 className="h-5 w-5 animate-spin text-brand" /> Loading property details…</div>
      ) : error && !property ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      ) : !property ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><Home className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 text-xl font-semibold">Property unavailable</h2><p className="mt-2 text-sm text-slate-600">This property is no longer available through your approved program.</p><Button asChild variant="outline" className="mt-6"><Link href="/applicant/properties">Back to available properties</Link></Button></div>
      ) : (
        <div className="space-y-5">
          <Link href="/applicant/properties" className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brandHover"><ArrowLeft className="h-4 w-4" /> Back to available properties</Link>
          <article className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative aspect-[4/3] bg-slate-100 lg:aspect-auto lg:min-h-[520px]">{property.images[0] ? <ResilientImage src={property.images[0].url} alt={property.images[0].altText || `${property.title} housing`} fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" priority /> : <div className="flex h-full min-h-[320px] items-center justify-center text-slate-300"><Home className="h-14 w-14" /></div>}</div>
              <div className="flex flex-col p-6 sm:p-8 lg:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Available through {programName}</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{property.title}</h1>
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4 text-brand" /> {property.address}, {property.city}, {property.state} {property.zip || ""}</p>
                <p className="mt-6 text-base leading-8 text-slate-600">{property.description}</p>
                <div className="mt-6 grid grid-cols-3 gap-3 text-sm text-slate-600"><div className="rounded-2xl bg-slate-50 p-4"><strong className="block text-base text-slate-950">{property.bedrooms}</strong>beds</div><div className="rounded-2xl bg-slate-50 p-4"><strong className="block text-base text-slate-950">{property.bathrooms}</strong>baths</div><div className="rounded-2xl bg-slate-50 p-4"><strong className="block text-base text-slate-950">{property.sqft.toLocaleString()}</strong>sqft</div></div>
                <p className="mt-6 text-2xl font-semibold text-slate-950">${property.rent.toLocaleString()}{property.rentMax ? `–$${property.rentMax.toLocaleString()}` : ""}<span className="text-sm font-normal text-slate-500">/mo</span></p>
                {property.amenities.length > 0 && <div className="mt-6"><h2 className="text-sm font-semibold text-slate-950">Property features</h2><div className="mt-3 flex flex-wrap gap-2">{property.amenities.map((amenity) => <span key={amenity} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">{amenity}</span>)}</div></div>}
                {error && <p className="mt-5 text-sm text-red-700">{error}</p>}
                <Button type="button" onClick={() => void changeInterest()} disabled={updating} className="mt-8 min-h-12 w-full sm:w-fit">{updating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : interestStatus === "INTERESTED" ? <><CheckCircle2 className="mr-2 h-4 w-4" /> I’m interested</> : <><Heart className="mr-2 h-4 w-4" /> {interestStatus === "WITHDRAWN" ? "Re-express interest" : "I’m interested"}</>}</Button>
                {interestStatus === "INTERESTED" && <p className="mt-3 text-sm text-emerald-700">Your interest has been recorded. A member of your support team can follow up with next steps.</p>}
              </div>
            </div>
          </article>
        </div>
      )}
    </ApplicantShell>
  );
}
"use client";

import Link from "next/link";
import { ArrowRight, BedDouble, MapPin, DollarSign } from "lucide-react";
import type { Property } from "@/types/property";

export function MapPopup({ property }: { property: Property }) {
  return (
    <div className="w-72 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="overflow-hidden rounded-3xl bg-slate-100">
        <div className="aspect-[4/3] bg-gradient-to-br from-brand/10 via-slate-100 to-white" />
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">{property.city}, {property.state}</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-950">{property.title}</h3>
          </div>
          <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">{property.status}</span>
        </div>
        <div className="grid gap-2 rounded-3xl bg-slate-50 p-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-brand" />
            <span className="font-semibold text-slate-950">${property.rent}/mo</span>
          </div>
          <div className="flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-brand" />
            <span>{property.bedrooms} beds · {property.bathrooms} baths · {property.sqft} sqft</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand" />
            <span>{property.address}, {property.city}</span>
          </div>
        </div>
        <Link
          href={`/ (marketing)/properties/${property.id}`.replace("/ (marketing)", "/(marketing)")}
          className="inline-flex w-full items-center justify-between rounded-3xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brandHover"
        >
          View details <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

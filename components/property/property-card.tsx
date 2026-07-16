import type { Property } from "@/types/property";
import { currency } from "@/lib/helpers/formatters";
import { ArrowRight, Heart } from "lucide-react";

export function PropertyCard({ property }: { property: Property }) {
  return (
    <article className="group overflow-hidden rounded-[24px] border border-border bg-white shadow-card transition hover:-translate-y-1 hover:shadow-soft">
      <div className="relative overflow-hidden bg-slate-100">
        <div className="aspect-[4/3] bg-gradient-to-br from-brand/10 via-slate-100 to-white px-4 py-5">
          <div className="h-full w-full rounded-[24px] bg-slate-200" />
        </div>
        <button type="button" className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-soft transition group-hover:bg-brand group-hover:text-white">
          <Heart className="h-5 w-5" />
        </button>
      </div>
      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">{property.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{property.city}, {property.state}</p>
          </div>
          <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">{property.status}</span>
        </div>
        <p className="text-sm leading-6 text-slate-600">{property.description}</p>
        <div className="grid gap-3 text-sm text-slate-500 sm:grid-cols-3">
          <div>{property.bedrooms} beds</div>
          <div>{property.bathrooms} baths</div>
          <div>{property.sqft} sqft</div>
        </div>
        <div className="flex items-center justify-between gap-4 pt-2">
          <span className="text-lg font-semibold text-slate-950">{currency(property.rent)}/mo</span>
          <button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-brand transition group-hover:text-brandHover">
            View details <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

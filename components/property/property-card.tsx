import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { currency } from "@/lib/helpers/formatters";
import { ResilientImage } from "@/components/marketing/resilient-image";
import type { Property } from "@/types/property";

type PropertyCardData = Omit<Property, "units" | "images"> & {
  units?: Property["units"];
  images: Array<{ id: string; url: string; altText?: string | null }>;
};

export function PropertyCard({ property }: { property: PropertyCardData }) {
  const image = property.images[0];

  return (
    <article className="group overflow-hidden rounded-[24px] border border-border bg-white shadow-card transition hover:-translate-y-1 hover:shadow-soft">
      <Link href={`/properties/${property.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]">
          {image ? (
            <ResilientImage
              src={image.url}
              alt={image.altText || `${property.title} housing exterior`}
              fill
              sizes="(max-width: 1024px) 100vw, 25vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : null}
        </div>
      </Link>
      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href={`/properties/${property.id}`} className="text-xl font-semibold text-slate-950 hover:text-brand">
              {property.title}
            </Link>
            <p className="mt-2 text-sm text-slate-600">{property.city}, {property.state}</p>
          </div>
          <span className="shrink-0 rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">{property.status}</span>
        </div>
        <p className="line-clamp-3 text-sm leading-6 text-slate-600">{property.description}</p>
        <div className="grid gap-3 text-sm text-slate-500 sm:grid-cols-3">
          <div>{property.bedrooms} beds</div>
          <div>{property.bathrooms} baths</div>
          <div>{property.sqft} sqft</div>
        </div>
        <div className="flex items-center justify-between gap-4 pt-2">
          <span className="text-lg font-semibold text-slate-950">{currency(property.rent)}/mo</span>
          <Link href={`/properties/${property.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-brand transition group-hover:text-brandHover">
            View details <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

import Link from "next/link";
import { ResilientImage } from "@/components/marketing/resilient-image";
import { getPropertyPresentation } from "@/lib/properties/property-presentation";
import type { Property } from "@/types/property";

type PropertyCardData = Omit<Property, "units" | "images"> & {
  units?: Property["units"];
  images: Array<{ id: string; url: string; altText?: string | null }>;
};

export function PropertyCard({ property }: { property: PropertyCardData }) {
  const image = property.images[0];
  const { isSale, categoryLabel, priceLabel } = getPropertyPresentation(property);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-border bg-white shadow-card transition hover:-translate-y-1 hover:shadow-soft">
      <Link href={`/properties/${property.id}`} className="block" aria-label={`View ${property.title}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]">
          {image ? (
            <ResilientImage
              src={image.url}
              alt={image.altText || `${property.title} property`}
              fill
              sizes="(max-width: 1024px) 100vw, 25vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100 text-sm font-medium text-slate-500">
              Photo coming soon
            </div>
          )}
          <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold tracking-wide text-white shadow-sm ${isSale ? "bg-slate-900" : "bg-brand"}`}>
            {categoryLabel}
          </span>
        </div>
      </Link>
      <div className="flex flex-grow flex-col space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Link href={`/properties/${property.id}`} className="text-xl font-semibold text-slate-950 hover:text-brand line-clamp-2">
              {property.title}
            </Link>
            <p className="mt-1 text-sm text-slate-600 line-clamp-1">
              {[property.city, property.state].filter(Boolean).join(", ") || "Location available in details"}
            </p>
          </div>
        </div>
        {property.description?.trim() ? (
          <p className="line-clamp-2 flex-grow text-sm leading-6 text-slate-600">{property.description}</p>
        ) : <div className="flex-grow" />}
        <div className="grid grid-cols-3 gap-3 text-sm text-slate-500">
          <div>{property.bedrooms} beds</div>
          <div>{property.bathrooms > 0 ? `${property.bathrooms} baths` : "Baths n/a"}</div>
          <div>{property.sqft > 0 ? `${property.sqft} sqft` : "Size n/a"}</div>
        </div>
        <div className="flex items-center justify-between gap-4 pt-2 mt-auto">
          <span className="text-lg font-semibold text-slate-950">{priceLabel}</span>
          <Link href={`/properties/${property.id}`} className="text-sm font-semibold text-brand transition group-hover:text-brandHover whitespace-nowrap">
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}

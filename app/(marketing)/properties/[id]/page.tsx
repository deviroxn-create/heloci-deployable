import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { PageShell } from "@/components/shared/page-shell";
import { ResilientImage } from "@/components/marketing/resilient-image";
import { Button } from "@/components/ui/button";
import { propertyCurrency } from "@/lib/helpers/formatters";
import { getPublicPropertyById } from "@/lib/properties/public-property.service";
import { getPropertyPresentation } from "@/lib/properties/property-presentation";

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getPublicPropertyById(id);

  if (!property) notFound();

  const presentation = getPropertyPresentation(property);
  const { isSale } = presentation;
  const featuredImage = property.images[0];

  return (
    <PageShell>
      <div className="space-y-6">
        <Link href={presentation.backHref} className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brandHover">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to {isSale ? "homes for sale" : "rentals"}
        </Link>
        <section className="grid gap-8 overflow-hidden rounded-[32px] bg-white shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative min-h-[320px] bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] lg:min-h-[520px]">
            {featuredImage ? (
              <ResilientImage src={featuredImage.url} alt={featuredImage.altText || `${property.title} property`} fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" priority />
            ) : (
              <div className="flex min-h-[320px] items-center justify-center text-sm font-medium text-slate-500 lg:min-h-[520px]">Property photo coming soon</div>
            )}
          </div>
          <div className="flex flex-col justify-center p-8 md:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold tracking-wide text-white ${isSale ? "bg-slate-900" : "bg-brand"}`}>
                {presentation.categoryLabel}
              </span>
              <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                Available {isSale ? "for purchase" : "for rent"}
              </span>
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{property.title}</h1>
            <p className="mt-4 flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4 text-brand" /> {property.city}, {property.state}</p>
            {property.address && <p className="mt-2 text-sm text-slate-500">{property.address}{property.zip ? `, ${property.zip}` : ""}</p>}
            {property.description?.trim() && <p className="mt-6 text-base leading-8 text-slate-600">{property.description}</p>}
            <div className="mt-8 grid grid-cols-3 gap-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4"><strong className="block text-base text-slate-950">{property.bedrooms}</strong> beds</div>
              <div className="rounded-2xl bg-slate-50 p-4"><strong className="block text-base text-slate-950">{property.bathrooms > 0 ? property.bathrooms : "—"}</strong> baths</div>
              <div className="rounded-2xl bg-slate-50 p-4"><strong className="block text-base text-slate-950">{property.sqft > 0 ? property.sqft : "—"}</strong> sqft</div>
            </div>
            <p className="mt-8 text-2xl font-semibold text-slate-950">{presentation.priceLabel}</p>
            {isSale ? (
              <div>
                <Button asChild className="mt-6 w-full sm:w-fit"><a href={presentation.actionHref}>{presentation.actionLabel}</a></Button>
                <p className="mt-3 max-w-md text-xs leading-5 text-slate-500">HELOCI does not provide a purchase application through this listing. Contact our team for information about next steps.</p>
              </div>
            ) : (
              <Button asChild className="mt-6 w-full sm:w-fit"><Link href={presentation.actionHref}>{presentation.actionLabel}</Link></Button>
            )}
          </div>
        </section>

        {property.images.length > 1 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-950">Property photos</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {property.images.map((image) => (
                <div key={image.id} className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]">
                  <ResilientImage src={image.url} alt={image.altText || `${property.title} photo`} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}
        {!isSale && property.units.length > 0 && (
          <section aria-labelledby="available-units-heading" className="rounded-[28px] bg-white p-6 shadow-soft md:p-8">
            <h2 id="available-units-heading" className="text-2xl font-semibold text-slate-950">Available rental units</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {property.units.map((unit) => (
                <div key={unit.id} className="rounded-2xl border border-border bg-slate-50 p-4">
                  <p className="font-semibold text-slate-950">{unit.beds} {unit.beds === 1 ? "bedroom" : "bedrooms"}</p>
                  {unit.price > 0 && <p className="mt-2 text-sm text-slate-600">{propertyCurrency(unit.price)} / month</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}

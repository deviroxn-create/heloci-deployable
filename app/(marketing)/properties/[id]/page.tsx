import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { PageShell } from "@/components/shared/page-shell";
import { ResilientImage } from "@/components/marketing/resilient-image";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/helpers/formatters";
import { getPublicPropertyById } from "@/lib/properties/public-property.service";

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getPublicPropertyById(id);

  if (!property) notFound();

  const featuredImage = property.images[0];

  return (
    <PageShell>
      <div className="space-y-6">
        <Link href="/properties" className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brandHover">
          <ArrowLeft className="h-4 w-4" /> Back to housing
        </Link>
        <section className="grid gap-8 overflow-hidden rounded-[32px] bg-white shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative min-h-[320px] bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] lg:min-h-[520px]">
            {featuredImage ? <ResilientImage src={featuredImage.url} alt={featuredImage.altText || `${property.title} housing exterior`} fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" priority /> : null}
          </div>
          <div className="flex flex-col justify-center p-8 md:p-10">
            <span className="w-fit rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">{property.status}</span>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{property.title}</h1>
            <p className="mt-4 flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4 text-brand" /> {property.city}, {property.state}</p>
            <p className="mt-6 text-base leading-8 text-slate-600">{property.description}</p>
            <div className="mt-8 grid grid-cols-3 gap-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4"><strong className="block text-base text-slate-950">{property.bedrooms}</strong> beds</div>
              <div className="rounded-2xl bg-slate-50 p-4"><strong className="block text-base text-slate-950">{property.bathrooms}</strong> baths</div>
              <div className="rounded-2xl bg-slate-50 p-4"><strong className="block text-base text-slate-950">{property.sqft}</strong> sqft</div>
            </div>
            <p className="mt-8 text-2xl font-semibold text-slate-950">{currency(property.rent)}/mo</p>
            <Button asChild className="mt-6 w-full sm:w-fit"><Link href="/check-eligibility">Check eligibility</Link></Button>
          </div>
        </section>

        {/* Image gallery */}
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
      </div>
    </PageShell>
  );
}

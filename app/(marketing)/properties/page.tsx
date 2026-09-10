import Link from "next/link";
import { MapPin, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/shared/page-shell";
import { PropertyCard } from "@/components/property/property-card";
import { listPublicProperties, countPublicProperties } from "@/lib/properties/public-property.service";

const PAGE_SIZE = 12;

export default async function Page({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const pageParam = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const currentPage = Math.max(1, isNaN(pageParam) ? 1 : pageParam);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const [properties, totalCount] = await Promise.all([
    listPublicProperties({ limit: PAGE_SIZE, offset }),
    countPublicProperties()
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <PageShell>
      <section className="rounded-[32px] bg-white px-6 py-10 shadow-soft md:px-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Available housing</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">Supportive homes you can apply for today.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">Explore current housing opportunities and take the next step with clear, guided support.</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild className="min-w-[170px]"><Link href="#featured-listings">Explore opportunities</Link></Button>
              <Button asChild variant="outline" className="min-w-[170px]"><Link href="/eligibility">Check eligibility</Link></Button>
            </div>
          </div>
          <div className="grid gap-4 rounded-[32px] bg-brand/10 p-6 text-slate-950 shadow-soft">
            <div className="rounded-[28px] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 text-brand"><MapPin className="h-5 w-5" /><p className="text-sm font-semibold uppercase tracking-[0.24em]">Housing opportunities</p></div>
              <p className="mt-4 text-sm text-slate-600">Browse properties published through Heloci and review the details available for each home.</p>
            </div>
            <div className="rounded-[28px] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 text-brand"><ShieldCheck className="h-5 w-5" /><p className="text-sm font-semibold uppercase tracking-[0.24em]">Guided applications</p></div>
              <p className="mt-4 text-sm text-slate-600">Use eligibility guidance and application support to understand what comes next.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="featured-listings" className="rounded-[32px] bg-slate-50 p-6 shadow-soft md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Published properties</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">Housing opportunities available through Heloci.</h2>
            {totalCount > 0 && (
              <p className="mt-2 text-sm text-slate-600">
                Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, totalCount)} of {totalCount} properties
              </p>
            )}
          </div>
        </div>
        {properties.length > 0 ? (
          <>
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  disabled={currentPage <= 1}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Link href={`/properties?page=${currentPage - 1}`}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Link>
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      asChild
                      variant={page === currentPage ? "primary" : "outline"}
                      size="sm"
                    >
                      <Link href={`/properties?page=${page}`}>{page}</Link>
                    </Button>
                  ))}
                </div>
                <Button
                  asChild
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Link href={`/properties?page=${currentPage + 1}`}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="mt-8 rounded-[28px] border border-border bg-white px-6 py-12 text-center">
            <p className="text-base text-slate-600">Housing opportunities will appear here once properties are published.</p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

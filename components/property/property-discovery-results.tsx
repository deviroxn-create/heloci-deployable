import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/shared/page-shell";
import { PropertyCard } from "@/components/property/property-card";
import {
  countPublicProperties,
  listPublicProperties,
  type PropertyListingCategory,
  type PublicPropertyFilters
} from "@/lib/properties/public-property.service";

const PAGE_SIZE = 12;

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(params: SearchParams, key: string): string {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function integerParam(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function queryForPage(filters: PublicPropertyFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.location) params.set("location", filters.location);
  if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
  if (filters.bedrooms !== undefined) params.set("bedrooms", String(filters.bedrooms));
  if (filters.bathrooms !== undefined) params.set("bathrooms", String(filters.bathrooms));
  params.set("page", String(page));
  return params.toString();
}

export async function PropertyDiscoveryResults({
  listingType,
  searchParams
}: {
  listingType: PropertyListingCategory;
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const pageParam = integerParam(firstParam(params, "page"));
  const currentPage = Math.max(1, pageParam ?? 1);
  const location = firstParam(params, "location").trim().slice(0, 100);
  const minPrice = integerParam(firstParam(params, "minPrice"));
  const maxPrice = integerParam(firstParam(params, "maxPrice"));
  const bedrooms = integerParam(firstParam(params, "bedrooms"));
  const bathrooms = integerParam(firstParam(params, "bathrooms"));
  const filters: PublicPropertyFilters = {
    ...(location ? { location } : {}),
    ...(minPrice !== undefined ? { minPrice } : {}),
    ...(maxPrice !== undefined ? { maxPrice } : {}),
    ...(bedrooms !== undefined ? { bedrooms } : {}),
    ...(bathrooms !== undefined ? { bathrooms } : {})
  };
  const offset = (currentPage - 1) * PAGE_SIZE;
  const [properties, totalCount] = await Promise.all([
    listPublicProperties({ listingType, limit: PAGE_SIZE, offset, filters }),
    countPublicProperties(listingType, filters)
  ]);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const isSale = listingType === "SALE";
  const basePath = isSale ? "/properties/buy" : "/properties/rent";

  return (
    <PageShell>
      <section className="rounded-[32px] bg-white px-6 py-9 shadow-soft md:px-10 md:py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">{isSale ? "Homes to purchase" : "Homes to rent"}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              {isSale ? "Find a home to buy." : "Find a place to rent."}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {isSale
                ? "Browse published homes confirmed available for purchase. Contact HELOCI for guidance on next steps."
                : "Explore published rentals with available units, then review the details and eligibility guidance."}
            </p>
          </div>
          <nav aria-label="Choose a property journey" className="flex shrink-0 gap-2">
            <Link
              href="/properties/rent"
              aria-current={!isSale ? "page" : undefined}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${!isSale ? "bg-brand text-white" : "border border-border text-slate-700 hover:bg-slate-50"}`}
            >
              Rent
            </Link>
            <Link
              href="/properties/buy"
              aria-current={isSale ? "page" : undefined}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${isSale ? "bg-slate-900 text-white" : "border border-border text-slate-700 hover:bg-slate-50"}`}
            >
              Buy
            </Link>
          </nav>
        </div>
      </section>

      <section className="rounded-[28px] border border-border bg-white p-5 shadow-soft md:p-7" aria-label="Property filters">
        <form action={basePath} method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <label className="text-sm font-medium text-slate-700 lg:col-span-2">
            Location
            <input
              type="search"
              name="location"
              defaultValue={location}
              placeholder="City, state, or address"
              maxLength={100}
              className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-base font-normal text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Minimum {isSale ? "price" : "monthly rent"}
            <input
              type="number"
              name="minPrice"
              min="0"
              step="1"
              defaultValue={filters.minPrice}
              placeholder="$0"
              className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-base font-normal text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Maximum {isSale ? "price" : "monthly rent"}
            <input
              type="number"
              name="maxPrice"
              min="0"
              step="1"
              defaultValue={filters.maxPrice}
              placeholder="No limit"
              className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-base font-normal text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Bedrooms
            <select name="bedrooms" defaultValue={filters.bedrooms ?? ""} className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-base font-normal text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20">
              <option value="">Any</option>
              <option value="0">Studio+</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Bathrooms
            <select name="bathrooms" defaultValue={filters.bathrooms ?? ""} className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-base font-normal text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20">
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
            </select>
          </label>
          <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-6">
            <Button type="submit" className="min-h-11">
              <Search aria-hidden="true" className="mr-2 h-4 w-4" />
              Search {isSale ? "homes" : "rentals"}
            </Button>
            <Link href={basePath} className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Clear filters
            </Link>
          </div>
        </form>
      </section>

      <section aria-labelledby="property-results-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">{isSale ? "For sale" : "For rent"}</p>
            <h2 id="property-results-heading" className="mt-2 text-2xl font-semibold text-slate-950">
              {totalCount > 0 ? `${totalCount} ${isSale ? "homes" : "rentals"} to explore` : "Available properties"}
            </h2>
          </div>
          {totalCount > 0 && (
            <p className="text-sm text-slate-600">
              Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, totalCount)} of {totalCount}
            </p>
          )}
        </div>

        {properties.length > 0 ? (
          <>
            <div className="mt-6 grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => <PropertyCard key={property.id} property={property} />)}
            </div>
            {totalPages > 1 && (
              <nav aria-label="Property pages" className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <Button asChild variant="outline" disabled={currentPage <= 1} className="disabled:cursor-not-allowed disabled:opacity-50">
                  <Link href={`${basePath}?${queryForPage(filters, Math.max(1, currentPage - 1))}`} aria-label="Previous page">
                    <ChevronLeft aria-hidden="true" className="mr-1 h-4 w-4" /> Previous
                  </Link>
                </Button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <Button key={page} asChild variant={page === currentPage ? "primary" : "outline"} size="sm">
                    <Link href={`${basePath}?${queryForPage(filters, page)}`} aria-current={page === currentPage ? "page" : undefined} aria-label={`Page ${page}`}>
                      {page}
                    </Link>
                  </Button>
                ))}
                <Button asChild variant="outline" disabled={currentPage >= totalPages} className="disabled:cursor-not-allowed disabled:opacity-50">
                  <Link href={`${basePath}?${queryForPage(filters, Math.min(totalPages, currentPage + 1))}`} aria-label="Next page">
                    Next <ChevronRight aria-hidden="true" className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </nav>
            )}
          </>
        ) : (
          <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-lg font-semibold text-slate-900">No matching {isSale ? "homes" : "rentals"} right now.</p>
            <p className="mt-2 text-sm text-slate-600">Try adjusting your filters or check back as new properties are published.</p>
            {Object.keys(filters).length > 0 && (
              <Link href={basePath} className="mt-5 inline-flex rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brandHover">
                Clear filters
              </Link>
            )}
          </div>
        )}
      </section>
    </PageShell>
  );
}

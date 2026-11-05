import { PropertyDiscoveryResults } from "@/components/property/property-discovery-results";

export default function BuyPropertiesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <PropertyDiscoveryResults listingType="SALE" searchParams={searchParams} />;
}

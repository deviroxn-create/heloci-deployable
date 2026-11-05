import { PropertyDiscoveryResults } from "@/components/property/property-discovery-results";

export default function RentPropertiesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <PropertyDiscoveryResults listingType="RENT" searchParams={searchParams} />;
}

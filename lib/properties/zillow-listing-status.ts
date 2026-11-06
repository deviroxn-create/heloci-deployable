export type ZillowSaleAvailability = "AVAILABLE" | "UNAVAILABLE" | "UNCERTAIN";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function normalizeStatus(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

const inactiveStatuses = [
  "sold",
  "pending",
  "under contract",
  "off market",
  "withdrawn",
  "delisted",
  "expired",
  "closed",
  "inactive",
  "not available",
  "unavailable"
];

const activeSaleStatuses = new Set([
  "active",
  "for sale",
  "house for sale"
]);

function containsInactiveStatus(status: string): boolean {
  return inactiveStatuses.some((inactive) =>
    status === inactive
    || status.startsWith(`${inactive} `)
    || status.endsWith(` ${inactive}`)
    || status.includes(` ${inactive} `)
  );
}

export function normalizeZillowSaleAvailability(value: unknown): ZillowSaleAvailability {
  const listing = asRecord(value);
  if (!listing) return "UNCERTAIN";
  const details = asRecord(listing.property_details);
  const sourceValues = [
    listing.listing_type,
    listing.status,
    listing.status_text,
    listing.marketing_status,
    details?.status,
    details?.status_text,
    details?.marketing_status
  ];
  const statuses = sourceValues
    .filter((status): status is string => typeof status === "string" && status.trim().length > 0)
    .map(normalizeStatus);

  if (statuses.length === 0) return "UNCERTAIN";
  if (statuses.some(containsInactiveStatus)) return "UNAVAILABLE";
  if (statuses.some((status) => !activeSaleStatuses.has(status))) return "UNCERTAIN";
  return "AVAILABLE";
}

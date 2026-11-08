export type ZillowSaleAvailability = "AVAILABLE" | "UNAVAILABLE" | "UNCERTAIN";
export type ZillowRentalAvailability = ZillowSaleAvailability;

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
  "unavailable",
  "rented"
];

const activeSaleStatuses = new Set([
  "active",
  "for sale",
  "house for sale",
  "condo for sale",
  "townhouse for sale",
  "multi family home for sale",
  "home for sale"
]);

const activeRentalStatuses = new Set([
  "active",
  "for rent",
  "apartment for rent",
  "house for rent",
  "townhouse for rent",
  "for lease",
  "available"
]);

const specialSaleStatusPatterns = [
  /\bforeclosure\b/,
  /\bfor sale by owner\b/,
  /\bnew construction\b/
];

function isInactiveStatus(status: string): boolean {
  return inactiveStatuses.some((inactive) =>
    status === inactive
    || status.startsWith(`${inactive} `)
    || status.endsWith(` ${inactive}`)
    || status.includes(` ${inactive} `)
  );
}

export function hasZillowSpecialSaleStatus(value: unknown): boolean {
  return sourceStatuses(value).some((status) =>
    specialSaleStatusPatterns.some((pattern) => pattern.test(status))
  );
}

function sourceStatuses(value: unknown): string[] {
  const listing = asRecord(value);
  if (!listing) return [];
  const details = asRecord(listing.property_details);
  const sourceValues = [
    listing.status,
    listing.status_text,
    details?.status,
    details?.status_text
  ];
  const statuses = sourceValues
    .filter((status): status is string => typeof status === "string" && status.trim().length > 0)
    .map(normalizeStatus);
  const marketingStatuses = [listing.marketing_status, details?.marketing_status]
    .filter((status): status is string => typeof status === "string" && status.trim().length > 0)
    .map(normalizeStatus);
  statuses.push(...marketingStatuses.filter(isInactiveStatus));
  return statuses;
}

function normalizeAvailability(statuses: string[], activeStatuses: Set<string>): ZillowSaleAvailability {
  if (statuses.length === 0) return "UNCERTAIN";
  if (statuses.some(isInactiveStatus)) return "UNAVAILABLE";
  if (statuses.some((status) => activeStatuses.has(status))) return "AVAILABLE";
  return "UNCERTAIN";
}

export function normalizeZillowSaleAvailability(value: unknown): ZillowSaleAvailability {
  const statuses = sourceStatuses(value);
  const availability = normalizeAvailability(statuses, activeSaleStatuses);
  if (availability === "UNAVAILABLE") return "UNAVAILABLE";
  return hasZillowSpecialSaleStatus(value) ? "UNCERTAIN" : availability;
}

export function normalizeZillowRentalAvailability(value: unknown): ZillowRentalAvailability {
  return normalizeAvailability(sourceStatuses(value), activeRentalStatuses);
}

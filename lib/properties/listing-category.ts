export type PropertyListingCategory = "RENT" | "SALE";

export function getPropertyListingCategory(listingType: string | null | undefined): PropertyListingCategory | null {
  const normalized = listingType?.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (["for sale", "sale", "buy", "purchase"].includes(normalized ?? "")) return "SALE";
  if (["for rent", "rent", "rental", "lease"].includes(normalized ?? "")) return "RENT";
  return null;
}

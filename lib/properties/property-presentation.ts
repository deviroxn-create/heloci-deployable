import { propertyCurrency } from "@/lib/helpers/formatters";
import { getPropertyListingCategory } from "./listing-category";

export function getPropertyPresentation(property: {
  id: string;
  title: string;
  listingType?: string | null;
  rent: number;
  salePrice?: number | null;
}) {
  const isSale = getPropertyListingCategory(property.listingType) === "SALE";
  const price = isSale ? property.salePrice : property.rent;

  return {
    isSale,
    categoryLabel: isSale ? "FOR SALE" : "FOR RENT",
    priceLabel: typeof price === "number" && price > 0
      ? isSale ? propertyCurrency(price) : `${propertyCurrency(price)} / month`
      : "Price unavailable",
    backHref: isSale ? "/properties/buy" : "/properties/rent",
    actionLabel: isSale ? "Contact HELOCI about this home" : "Check rental eligibility",
    actionHref: isSale
      ? `mailto:support@heloci.ngo?subject=${encodeURIComponent(`Question about ${property.title}`)}`
      : "/check-eligibility"
  };
}

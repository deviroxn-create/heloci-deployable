import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PropertyCard } from "./property-card";
import type { Property } from "@/types/property";

const baseProperty: Property = {
  id: "property-1",
  title: "Maple Street Home",
  description: "A welcoming home near local services.",
  address: "100 Maple Street",
  city: "Austin",
  state: "TX",
  rent: 1850,
  bedrooms: 2,
  bathrooms: 1,
  sqft: 980,
  amenities: [],
  specialOffers: [],
  availabilityCount: 1,
  status: "AVAILABLE",
  units: [],
  images: []
};

test("rental cards label the listing and format monthly rent", () => {
  const markup = renderToStaticMarkup(createElement(PropertyCard, { property: { ...baseProperty, listingType: "For Rent" } }));

  assert.match(markup, /FOR RENT/);
  assert.match(markup, /\$1,850 \/ month/);
  assert.doesNotMatch(markup, /FOR SALE/);
  assert.match(markup, /Maple Street Home/);
  assert.match(markup, /Austin, TX/);
  assert.match(markup, /Photo coming soon/);
  assert.match(markup, /View details/);
});

test("sale cards show total sale price without rental pricing", () => {
  const markup = renderToStaticMarkup(createElement(PropertyCard, {
    property: { ...baseProperty, rent: 0, listingType: "For Sale", salePrice: 285000 }
  }));

  assert.match(markup, /FOR SALE/);
  assert.match(markup, /\$285,000/);
  assert.doesNotMatch(markup, /\/ month/);
  assert.doesNotMatch(markup, /\$0/);
  assert.doesNotMatch(markup, /\$1,850/);
});

test("missing prices are not rendered as zero", () => {
  const markup = renderToStaticMarkup(createElement(PropertyCard, {
    property: { ...baseProperty, rent: 0, listingType: "For Rent" }
  }));

  assert.match(markup, /Price unavailable/);
  assert.doesNotMatch(markup, /\$0/);
});

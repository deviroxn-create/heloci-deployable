import assert from "node:assert/strict";
import test from "node:test";
import { getPropertyPresentation } from "./property-presentation";

test("rental detail presentation uses monthly rent and the existing eligibility action", () => {
  const presentation = getPropertyPresentation({
    id: "rental-1",
    title: "Rental home",
    listingType: "For Rent",
    rent: 1850,
    salePrice: null
  });

  assert.equal(presentation.isSale, false);
  assert.equal(presentation.categoryLabel, "FOR RENT");
  assert.equal(presentation.priceLabel, "$1,850 / month");
  assert.equal(presentation.backHref, "/properties/rent");
  assert.equal(presentation.actionHref, "/check-eligibility");
  assert.equal(presentation.actionLabel, "Check rental eligibility");
});

test("sale detail presentation uses total price and a contact-only action", () => {
  const presentation = getPropertyPresentation({
    id: "sale-1",
    title: "Purchase home",
    listingType: "For Sale",
    rent: 0,
    salePrice: 285000
  });

  assert.equal(presentation.isSale, true);
  assert.equal(presentation.categoryLabel, "FOR SALE");
  assert.equal(presentation.priceLabel, "$285,000");
  assert.equal(presentation.backHref, "/properties/buy");
  assert.equal(presentation.actionHref, "mailto:support@heloci.ngo?subject=Question%20about%20Purchase%20home");
  assert.equal(presentation.actionLabel, "Contact HELOCI about this home");
  assert.doesNotMatch(presentation.priceLabel, /\/ month/);
});

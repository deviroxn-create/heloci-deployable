import assert from "node:assert/strict";
import test from "node:test";
import { evaluatePropertyForApproval } from "./property-review.service";

const rentalListing = {
  property_id: "rental-1",
  property_name: "Complete rental",
  listing_type: "For Rent",
  status: "FOR_RENT",
  status_text: "Active",
  description: "A well-maintained two-bedroom home.",
  address: "1 Main Street",
  city: "Austin",
  state: "TX",
  bedrooms: 2,
  bathrooms: 1,
  living_area: 950
};

const completeRental = {
  externalId: "zillow:rental-1",
  listingType: "For Rent",
  rent: 2400,
  salePrice: null,
  title: "Complete rental",
  description: "A well-maintained two-bedroom home.",
  address: "1 Main Street",
  city: "Austin",
  state: "TX",
  bedrooms: 2,
  bathrooms: 1,
  sqft: 950,
  sourceName: "Zillow",
  sourceMetadata: { sourceListing: rentalListing },
  status: "AVAILABLE",
  units: [{ available: true, beds: 2, price: 2400 }],
  images: [{ url: "https://example.test/rental.jpg" }]
};

const saleListing = {
  ...rentalListing,
  property_id: "sale-1",
  property_name: "Complete sale",
  listing_type: "For Sale",
  status: "FOR_SALE"
};

const completeSale = {
  ...completeRental,
  externalId: "zillow:sale-1",
  listingType: "For Sale",
  rent: 0,
  salePrice: 725000,
  title: "Complete sale",
  sourceMetadata: { sourceListing: saleListing },
  units: []
};

test("complete rental automatically qualifies for publication", () => {
  const result = evaluatePropertyForApproval(completeRental);

  assert.equal(result.decision, "PUBLISHED");
  assert.equal(result.automaticDecision, "PUBLISHED");
  assert.equal(result.availability, "AVAILABLE");
  assert.deepEqual(result.reasons, []);
});

test("complete sale automatically qualifies only with explicit positive source availability", () => {
  const result = evaluatePropertyForApproval({
    ...completeSale,
    sourceMetadata: { sourceListing: { ...saleListing, status_text: "Active" } }
  });

  assert.equal(result.decision, "PUBLISHED");
  assert.equal(result.availability, "AVAILABLE");
});

test("missing rental price is sent for manual review", () => {
  const result = evaluatePropertyForApproval({ ...completeRental, rent: 0 });

  assert.equal(result.decision, "PENDING_REVIEW");
  assert.ok(result.reasons.includes("rental_price_missing_or_invalid"));
});

test("missing sale price is sent for manual review", () => {
  const result = evaluatePropertyForApproval({ ...completeSale, salePrice: null });

  assert.equal(result.decision, "PENDING_REVIEW");
  assert.ok(result.reasons.includes("sale_price_missing_or_invalid"));
});

test("missing address is sent for manual review", () => {
  const result = evaluatePropertyForApproval({ ...completeRental, address: "" });

  assert.equal(result.decision, "PENDING_REVIEW");
  assert.ok(result.reasons.includes("address_incomplete"));
});

test("sale availability is uncertain unless the source explicitly reports Active", () => {
  const result = evaluatePropertyForApproval({
    ...completeSale,
    sourceMetadata: { sourceListing: { ...saleListing, status_text: undefined } }
  });

  assert.equal(result.decision, "PENDING_REVIEW");
  assert.equal(result.availability, "UNCERTAIN");
  assert.ok(result.reasons.includes("availability_not_confirmed"));
});

test("confirmed unavailable properties are never published", () => {
  const rental = evaluatePropertyForApproval({
    ...completeRental,
    status: "UNAVAILABLE",
    units: [{ available: false, beds: 2, price: 2400 }]
  });
  const sale = evaluatePropertyForApproval({
    ...completeSale,
    sourceMetadata: { sourceListing: { ...saleListing, status_text: "Sold" } }
  });

  assert.equal(rental.decision, "PENDING_REVIEW");
  assert.equal(rental.availability, "UNAVAILABLE");
  assert.equal(sale.decision, "PENDING_REVIEW");
  assert.equal(sale.availability, "UNAVAILABLE");
});

test("staff rejection and publication decisions survive automatic evaluation", () => {
  const rejected = evaluatePropertyForApproval(completeRental, {
    staffManaged: true,
    staffManagedStatus: "REJECTED"
  });
  const unpublished = evaluatePropertyForApproval(completeRental, {
    staffManaged: true,
    staffManagedStatus: "APPROVED_UNPUBLISHED"
  });

  assert.equal(rejected.decision, "REJECTED");
  assert.equal(rejected.automaticDecision, "PUBLISHED");
  assert.equal(unpublished.decision, "APPROVED_UNPUBLISHED");
  assert.ok(rejected.reasons.includes("staff_managed_publication_decision_preserved"));
});

test("duplicate import records cannot be automatically published", () => {
  const result = evaluatePropertyForApproval(completeRental, { duplicateInImport: true });

  assert.equal(result.decision, "PENDING_REVIEW");
  assert.ok(result.reasons.includes("duplicate_external_id_in_import"));
});

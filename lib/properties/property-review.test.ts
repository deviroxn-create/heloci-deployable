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

test("sale status variants in the Zillow record confirm availability", () => {
  const variants = [
    { status: "Active" },
    { status: "For Sale" },
    { status: "House for sale" },
    { property_details: { status: "House for sale", status_text: "For Sale", marketing_status: "FOR_SALE" } }
  ];

  for (const status of variants) {
    const result = evaluatePropertyForApproval({
      ...completeSale,
      sourceMetadata: { sourceListing: { ...saleListing, status_text: undefined, ...status } }
    });

    assert.equal(result.availability, "AVAILABLE", JSON.stringify(status));
    assert.equal(result.decision, "PUBLISHED", JSON.stringify(status));
  }
});

test("marketing status alone does not establish active sale availability", () => {
  for (const sourceListing of [
    { ...saleListing, status: undefined, status_text: undefined, marketing_status: "FOR_SALE" },
    { ...saleListing, status: undefined, status_text: undefined, property_details: { marketing_status: "FOR_SALE" } }
  ]) {
    const result = evaluatePropertyForApproval({
      ...completeSale,
      sourceMetadata: { sourceListing }
    });
    assert.equal(result.availability, "UNCERTAIN");
    assert.equal(result.decision, "PENDING_REVIEW");
  }
});

test("sale availability does not require rental units", () => {
  const result = evaluatePropertyForApproval({ ...completeSale, units: [] });

  assert.equal(result.availability, "AVAILABLE");
  assert.equal(result.decision, "PUBLISHED");
  assert.equal(result.reasons.some((reason) => reason.includes("unit")), false);
});

test("sale availability does not require rental-specific bedroom, bathroom, or area fields", () => {
  const result = evaluatePropertyForApproval({
    ...completeSale,
    bedrooms: 0,
    bathrooms: 0,
    sqft: 0,
    sourceMetadata: {
      sourceListing: {
        ...saleListing,
        bedrooms: undefined,
        bathrooms: undefined,
        living_area: undefined
      }
    }
  });

  assert.equal(result.availability, "AVAILABLE");
  assert.equal(result.decision, "PUBLISHED");
  assert.equal(result.reasons.some((reason) => /bedrooms|bathrooms|living_area/.test(reason)), false);
});

test("sale requires trusted identity, meaningful details, and a usable image", () => {
  for (const partial of [
    { externalId: "zillow:other" },
    { description: "Short" },
    { images: [{ url: "javascript:alert(1)" }] },
    { title: "Zillow listing 1" },
    { address: "" }
  ]) {
    const result = evaluatePropertyForApproval({ ...completeSale, ...partial });
    assert.equal(result.decision, "PENDING_REVIEW");
  }
});

test("sale availability requires a complete address including city and state", () => {
  for (const partial of [{ city: "" }, { state: "" }]) {
    const result = evaluatePropertyForApproval({ ...completeSale, ...partial });
    assert.equal(result.availability, "AVAILABLE");
    assert.equal(result.decision, "PENDING_REVIEW");
    assert.ok(result.reasons.includes("address_incomplete"));
  }
});

test("Zillow House for sale sample normalizes as an available sale with its purchase price", () => {
  const result = evaluatePropertyForApproval({
    ...completeSale,
    salePrice: 449900,
    externalId: "zillow:52410627",
    sourceMetadata: {
      sourceListing: {
        ...saleListing,
        property_id: "52410627",
        listing_type: "For Sale",
        status: "House for sale",
        status_text: "House for sale",
        property_details: {
          status: "House for sale",
          status_text: "House for sale",
          marketing_status: "FOR_SALE"
        }
      }
    }
  });

  assert.equal(result.availability, "AVAILABLE");
  assert.equal(result.decision, "PUBLISHED");
  assert.equal(result.reasons.includes("sale_price_missing_or_invalid"), false);
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

test("sale availability is uncertain when source status is unknown", () => {
  const result = evaluatePropertyForApproval({
    ...completeSale,
    sourceMetadata: { sourceListing: { ...saleListing, status: "Unknown", status_text: "For sale soon", marketing_status: undefined } }
  });

  assert.equal(result.decision, "PENDING_REVIEW");
  assert.equal(result.availability, "UNCERTAIN");
  assert.ok(result.reasons.includes("availability_not_confirmed"));
});

test("conflicting active and inactive sale statuses remain unavailable and require review", () => {
  const result = evaluatePropertyForApproval({
    ...completeSale,
    sourceMetadata: { sourceListing: { ...saleListing, status_text: "House for sale", marketing_status: "PENDING" } }
  });

  assert.equal(result.availability, "UNAVAILABLE");
  assert.equal(result.decision, "PENDING_REVIEW");
  assert.ok(result.reasons.includes("listing_confirmed_unavailable"));
});

test("confirmed unavailable properties are never published", () => {
  const rental = evaluatePropertyForApproval({
    ...completeRental,
    sourceMetadata: { sourceListing: { ...rentalListing, status: "Rented", status_text: "Rented" } },
    status: "UNAVAILABLE",
    units: [{ available: false, beds: 2, price: 2400 }]
  });
  const sale = evaluatePropertyForApproval({
    ...completeSale,
    sourceMetadata: { sourceListing: { ...saleListing, status_text: "Sold" } }
  });
  const inactiveStatuses = ["Sold", "Pending", "Under contract", "Withdrawn", "Off market", "Delisted", "Expired"];
  const inactiveSales = inactiveStatuses.map((status) => evaluatePropertyForApproval({
    ...completeSale,
    sourceMetadata: { sourceListing: { ...saleListing, status_text: status } }
  }));

  assert.equal(rental.decision, "PENDING_REVIEW");
  assert.equal(rental.availability, "UNAVAILABLE");
  assert.equal(sale.decision, "PENDING_REVIEW");
  assert.equal(sale.availability, "UNAVAILABLE");
  for (const result of inactiveSales) {
    assert.equal(result.availability, "UNAVAILABLE");
    assert.equal(result.decision, "PENDING_REVIEW");
  }
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

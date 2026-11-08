import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeZillowRentalAvailability,
  normalizeZillowSaleAvailability
} from "./zillow-listing-status";

test("sale status normalizer recognizes supported explicit active Zillow values", () => {
  const statuses = [
    "Active",
    "For Sale",
    "House for sale",
    "Condo for sale",
    "Townhouse for sale",
    "Multi family home for sale",
    "Home for sale",
    "FOR_SALE"
  ];

  for (const status of statuses) {
    assert.equal(normalizeZillowSaleAvailability({ status }), "AVAILABLE", status);
  }
});

test("ambiguous sale statuses require an explicit active status", () => {
  for (const status of ["Foreclosure", "For sale by owner", "New construction"]) {
    assert.equal(normalizeZillowSaleAvailability({ status }), "UNCERTAIN", status);
  }
  assert.equal(normalizeZillowSaleAvailability({ listing_type: "For Sale" }), "UNCERTAIN");
  assert.equal(
    normalizeZillowSaleAvailability({ status: "Active", status_text: "New construction" }),
    "UNCERTAIN"
  );
  assert.equal(
    normalizeZillowSaleAvailability({ status: "Unknown", status_text: "Foreclosure", marketing_status: "FOR_SALE" }),
    "UNCERTAIN"
  );
  assert.equal(
    normalizeZillowSaleAvailability({ status: "Unknown", status_text: "For sale by owner", marketing_status: "FOR_SALE" }),
    "UNCERTAIN"
  );
});

test("inactive Zillow sale statuses take precedence over conflicting active values", () => {
  for (const status of ["Sold", "Pending", "Under contract", "Expired", "Withdrawn", "Delisted"]) {
    assert.equal(
      normalizeZillowSaleAvailability({ status: "Active", status_text: status, marketing_status: "FOR_SALE" }),
      "UNAVAILABLE",
      status
    );
  }
});

test("marketing status alone cannot establish active availability", () => {
  assert.equal(normalizeZillowSaleAvailability({ marketing_status: "FOR_SALE" }), "UNCERTAIN");
  assert.equal(
    normalizeZillowSaleAvailability({ property_details: { marketing_status: "FOR_SALE" } }),
    "UNCERTAIN"
  );
  assert.equal(
    normalizeZillowSaleAvailability({ status: "Active", marketing_status: "PENDING" }),
    "UNAVAILABLE"
  );
});

test("rental availability requires an explicit active status rather than listing type alone", () => {
  assert.equal(normalizeZillowRentalAvailability({ listing_type: "For Rent" }), "UNCERTAIN");
  for (const status of ["Active", "For Rent", "Apartment for rent", "Townhouse for rent", "FOR_RENT", "For lease"]) {
    assert.equal(normalizeZillowRentalAvailability({ status }), "AVAILABLE", status);
  }
});

test("inactive rental status takes precedence over active status", () => {
  assert.equal(
    normalizeZillowRentalAvailability({ status: "Active", status_text: "Rented" }),
    "UNAVAILABLE"
  );
});

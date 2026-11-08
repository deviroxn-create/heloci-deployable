import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const applicantShell = readFileSync("components/applicant/applicant-shell.tsx", "utf8");
const applicantPropertiesPage = readFileSync("app/applicant/properties/page.tsx", "utf8");
const rentPage = readFileSync("app/(marketing)/properties/rent/page.tsx", "utf8");
const buyPage = readFileSync("app/(marketing)/properties/buy/page.tsx", "utf8");

test("applicant desktop and mobile navigation link to public Rent and Buy discovery", () => {
  assert.match(applicantShell, /label: "Rent", href: "\/properties\/rent"/);
  assert.match(applicantShell, /label: "Buy", href: "\/properties\/buy"/);
  assert.equal((applicantShell.match(/<ApplicantNavigation/g) ?? []).length, 2);
});

test("applicant properties page links to the shared public rental and sale views", () => {
  assert.match(applicantPropertiesPage, /href="\/properties\/rent">Browse rentals/);
  assert.match(applicantPropertiesPage, /href="\/properties\/buy">Browse homes for sale/);
  assert.match(rentPage, /PropertyDiscoveryResults listingType="RENT"/);
  assert.match(buyPage, /PropertyDiscoveryResults listingType="SALE"/);
  assert.match(applicantPropertiesPage, /fetch\("\/api\/applicant\/properties"\)/);
});

test("public discovery links do not replace applicant account navigation", () => {
  for (const href of [
    "/applicant/dashboard",
    "/applicant/applications",
    "/applicant/properties",
    "/applicant/documents",
    "/applicant/messages",
    "/applicant/settings"
  ]) {
    assert.ok(applicantShell.includes(`href: "${href}"`), `Expected applicant navigation to retain ${href}`);
  }
});

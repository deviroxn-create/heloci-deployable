# Property availability provenance

`Property.availabilityStatusSource` identifies who or what set the current availability decision:

- `AUTOMATIC`: a trusted application workflow made the decision. Zillow imports persist a versioned `helociAvailabilityDecision` marker that records the status produced by the importer.
- `STAFF`: an authorized administrator deliberately changed availability or rental-unit availability.
- `UNKNOWN`: the origin cannot be established. Historical records default to this value; imported source fields alone do not prove who set HELOCI availability.

## Evidence review

The provenance review API groups unknown records into:

- **Strong automatic evidence**: the trusted internal importer marker is version 1, matches the current status, the Zillow property ID exactly matches the external ID, the listing category and required price are valid, source availability is determinate, and rentals have a valid available unit. Sales additionally require a non-placeholder title, complete address, meaningful description, and usable image. Sale eligibility does not depend on rental pricing, bedroom/bathroom/area fields, rental occupancy, rental units, or available-unit counts.
- **Staff review required**: historical origin is unproved, source status is uncertain, or other evidence is insufficient. A Zillow `Active`, `For Sale`, or `FOR_SALE` field is not availability-provenance evidence.
- **Not eligible for automatic approval**: identity conflicts, listing category is unsupported, required price or data is invalid, or sale listing details/images are incomplete. Rental-unit requirements apply only to rentals; sales do not need unit records or an available-unit count. An administrator may still explicitly classify the record as staff-managed with a reason.

Publication status does not establish availability provenance. Neither does current `AVAILABLE`/`UNAVAILABLE` status alone.

An explicit recognized active status is required to establish source availability. Zillow `marketing_status` is shown as evidence for review and may disqualify an active status when it conflicts with it, but marketing status alone cannot establish that a listing is active. Sold, pending, under-contract, withdrawn, expired, and delisted statuses are not active.

On repeat imports, previously observed inactive status evidence is retained when a later payload is active or omits status. An import therefore cannot automatically reactivate a previously sold, pending, withdrawn, expired, delisted, or otherwise inactive listing.

## Administrator approval

An organization administrator reviews each record in Admin property management, inspects source identity, status fields, prices, rental units, missing data, and the evidence category, then chooses one record at a time:

- Approve `AUTOMATIC` only when strong evidence qualifies.
- Open the property's details and confirm `STAFF` only after verifying that the current availability decision was intentional. The API requires this confirmation and a meaningful review reason of at least 12 characters.
- Leave uncertain records as `UNKNOWN`.

Every classification requires a reason. The API derives organization scope and actor identity from the authenticated session, checks organization-admin authorization, validates a current evidence token, conditionally changes only `availabilityStatusSource`, and writes the actor, time, reason, and evidence to the existing `AuditLog` in the same transaction. Concurrent serialization conflicts, stale records, and already-classified records are reported as conflicts and must be re-reviewed.

The Admin interface labels provenance separately from actual availability and publication status. Classifying a property as `STAFF` protects its current availability decision from automatic reconciliation; it does not make the property available or published.

The one-time Zillow sale activation is restricted to organization `org_heloci` and the exact approved 416-property ID digest. It requires a fresh read-only preview, explicit admin confirmation, and the same candidate ID list at execution. A serializable transaction changes only availability, publication status, and their provenance to `STAFF`, and records the actor, timestamp, previous values, new values, and reason in one `AuditLog` entry per property. The service verifies the persisted property state and audit entries after commit.

The Admin property editor exposes a sale-price field for sales and does not show rental-unit management for sale listings. Rental listings continue to use monthly rent and rental units.

## Public Rent and Buy discovery

`/properties/rent` includes only published, available records with a recognized rental listing category, a positive rental price, and a valid available rental unit. `/properties/buy` includes only published, available records with a recognized sale category and positive sale price; rental units are not required. The general `/properties` landing page uses these same category-specific queries. Missing or unrecognized listing categories are excluded from both routes and their detail lookups.

## Reconciliation after review

`STAFF` and `UNKNOWN` records remain excluded from automatic availability and publication reconciliation. A technical sale-eligibility preview is not HELOCI authorization: records with `UNKNOWN` provenance remain unchanged until an authorized decision and a fresh reconciliation preview. After an administrator approves provenance as `AUTOMATIC`, generate that fresh reconciliation preview. It independently validates listing category, source status, category-specific prices and units, publication readiness, and staff publication decisions. Provenance approval itself never changes availability, publication, or related records, and it does not execute reconciliation.

Historical records remain `UNKNOWN` unless reliable importer metadata or verifiable audit history establishes their origin. No historical bulk backfill is performed.

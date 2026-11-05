ALTER TABLE "Property"
ADD COLUMN "publicationStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
ADD COLUMN "publicationStatusSource" TEXT NOT NULL DEFAULT 'AUTOMATIC';

-- Preserve previously visible rentals that have a valid rent price.
UPDATE "Property" AS property
SET "publicationStatus" = 'PUBLISHED',
    "publicationStatusSource" = 'MIGRATION'
WHERE property."organizationId" IS NOT NULL
  AND property."status" = 'AVAILABLE'
  AND property."rent" > 0
  AND (
    property."listingType" IS NULL
    OR property."listingType" NOT IN (
      'For Sale', 'FOR_SALE', 'for sale', 'FOR SALE', 'sale', 'SALE',
      'Buy', 'BUY', 'buy', 'Purchase', 'PURCHASE', 'purchase'
    )
  )
  AND EXISTS (
    SELECT 1
    FROM "PropertyUnit" AS unit
    WHERE unit."propertyId" = property."id"
      AND unit."available" = TRUE
  );

CREATE INDEX "Property_publicationStatus_idx" ON "Property"("publicationStatus");

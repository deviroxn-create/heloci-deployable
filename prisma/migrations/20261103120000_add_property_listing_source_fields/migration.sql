ALTER TABLE "Property"
ADD COLUMN "listingType" TEXT,
ADD COLUMN "salePrice" INTEGER,
ADD COLUMN "sourceName" TEXT,
ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "sourceStatus" TEXT,
ADD COLUMN "sourceMetadata" JSONB;
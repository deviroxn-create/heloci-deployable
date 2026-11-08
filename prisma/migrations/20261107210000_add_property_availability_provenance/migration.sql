CREATE TYPE "AvailabilityStatusSource" AS ENUM ('AUTOMATIC', 'STAFF', 'UNKNOWN');

ALTER TABLE "Property"
ADD COLUMN "availabilityStatusSource" "AvailabilityStatusSource" NOT NULL DEFAULT 'UNKNOWN';

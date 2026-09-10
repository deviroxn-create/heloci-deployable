-- Add nullable ownership without changing existing property records.
ALTER TABLE "Property" ADD COLUMN "organizationId" TEXT;

CREATE INDEX "Property_organizationId_idx" ON "Property"("organizationId");

ALTER TABLE "Property"
ADD CONSTRAINT "Property_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
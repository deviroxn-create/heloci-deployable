-- Add program-specific property availability without creating relationships.
CREATE UNIQUE INDEX "Property_organizationId_id_key" ON "Property"("organizationId", "id");

CREATE UNIQUE INDEX "Program_organizationId_id_key" ON "Program"("organizationId", "id");

CREATE TABLE "ProgramProperty" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "availableFrom" TIMESTAMP(3),
    "availableUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramProperty_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProgramProperty_programId_propertyId_key" ON "ProgramProperty"("programId", "propertyId");
CREATE INDEX "ProgramProperty_organizationId_isActive_idx" ON "ProgramProperty"("organizationId", "isActive");
CREATE INDEX "ProgramProperty_programId_isActive_idx" ON "ProgramProperty"("programId", "isActive");
CREATE INDEX "ProgramProperty_propertyId_isActive_idx" ON "ProgramProperty"("propertyId", "isActive");

ALTER TABLE "ProgramProperty"
ADD CONSTRAINT "ProgramProperty_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProgramProperty"
ADD CONSTRAINT "ProgramProperty_organizationId_programId_fkey"
FOREIGN KEY ("organizationId", "programId") REFERENCES "Program"("organizationId", "id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProgramProperty"
ADD CONSTRAINT "ProgramProperty_organizationId_propertyId_fkey"
FOREIGN KEY ("organizationId", "propertyId") REFERENCES "Property"("organizationId", "id")
ON DELETE CASCADE ON UPDATE CASCADE;
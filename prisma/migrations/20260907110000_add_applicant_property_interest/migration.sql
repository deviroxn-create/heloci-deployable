-- Add applicant interest tracking without creating interest records.
CREATE TABLE "ApplicantPropertyInterest" (
    "id" TEXT NOT NULL,
    "programApplicationId" TEXT NOT NULL,
    "programPropertyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INTERESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicantPropertyInterest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApplicantPropertyInterest_programApplicationId_programPropertyId_key"
ON "ApplicantPropertyInterest"("programApplicationId", "programPropertyId");

CREATE INDEX "ApplicantPropertyInterest_programApplicationId_status_idx"
ON "ApplicantPropertyInterest"("programApplicationId", "status");

CREATE INDEX "ApplicantPropertyInterest_programPropertyId_status_idx"
ON "ApplicantPropertyInterest"("programPropertyId", "status");

ALTER TABLE "ApplicantPropertyInterest"
ADD CONSTRAINT "ApplicantPropertyInterest_programApplicationId_fkey"
FOREIGN KEY ("programApplicationId") REFERENCES "ProgramApplication"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApplicantPropertyInterest"
ADD CONSTRAINT "ApplicantPropertyInterest_programPropertyId_fkey"
FOREIGN KEY ("programPropertyId") REFERENCES "ProgramProperty"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
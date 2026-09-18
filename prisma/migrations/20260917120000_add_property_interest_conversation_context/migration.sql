ALTER TABLE "CaseConversation" ADD COLUMN "propertyInterestId" TEXT;

CREATE UNIQUE INDEX "CaseConversation_propertyInterestId_key"
ON "CaseConversation"("propertyInterestId");

ALTER TABLE "CaseConversation"
ADD CONSTRAINT "CaseConversation_propertyInterestId_fkey"
FOREIGN KEY ("propertyInterestId") REFERENCES "ApplicantPropertyInterest"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
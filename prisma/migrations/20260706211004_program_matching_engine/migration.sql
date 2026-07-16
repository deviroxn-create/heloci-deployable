-- AlterTable
ALTER TABLE "EligibilityResult" ADD COLUMN     "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "needsReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "category" TEXT,
ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "matchDescription" TEXT,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "organizationId" TEXT;

-- CreateTable
CREATE TABLE "ProgramRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "missingFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgramRecommendation_userId_type_idx" ON "ProgramRecommendation"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramRecommendation_userId_programId_type_key" ON "ProgramRecommendation"("userId", "programId", "type");

-- AddForeignKey
ALTER TABLE "ProgramRecommendation" ADD CONSTRAINT "ProgramRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramRecommendation" ADD CONSTRAINT "ProgramRecommendation_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

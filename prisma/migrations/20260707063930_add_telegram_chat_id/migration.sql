/*
  Warnings:

  - You are about to drop the column `sortOrder` on the `Question` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `EligibilityRule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `QuestionSet` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "EligibilityRule_programId_version_key";

-- DropIndex
DROP INDEX "Question_pageId_sortOrder_idx";

-- AlterTable
ALTER TABLE "DocumentRequest" ADD COLUMN     "autoExpired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "reminderSentAt" TIMESTAMP(3),
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT;

-- AlterTable
ALTER TABLE "EligibilityRule" ADD COLUMN     "explanation" TEXT,
ADD COLUMN     "explanationNo" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "weight" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "autoAssignReviewers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "decisionSlaDays" INTEGER NOT NULL DEFAULT 14,
ADD COLUMN     "documentSlaDays" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "maxWaitlistSize" INTEGER;

-- AlterTable
ALTER TABLE "ProgramApplication" ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "slaBreachedAt" TIMESTAMP(3),
ADD COLUMN     "waitlistedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "sortOrder",
ADD COLUMN     "conditional" JSONB,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "optionsRaw" JSONB,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "page" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "profileMapping" TEXT,
ADD COLUMN     "section" TEXT,
ADD COLUMN     "validationRaw" JSONB;

-- AlterTable
ALTER TABLE "QuestionSet" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "WorkflowTrigger" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "condition" JSONB,
    "action" TEXT NOT NULL,
    "actionConfig" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promotedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "removeReason" TEXT,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkflowTrigger_programId_event_isActive_idx" ON "WorkflowTrigger"("programId", "event", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_applicationId_key" ON "WaitlistEntry"("applicationId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_programId_position_promotedAt_idx" ON "WaitlistEntry"("programId", "position", "promotedAt");

-- CreateIndex
CREATE INDEX "Question_pageId_order_idx" ON "Question"("pageId", "order");

-- AddForeignKey
ALTER TABLE "EligibilityRule" ADD CONSTRAINT "EligibilityRule_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequest" ADD CONSTRAINT "DocumentRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTrigger" ADD CONSTRAINT "WorkflowTrigger_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ProgramApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - Added the required column `createdBy` to the `Program` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedBy" TEXT,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "maxApplicants" INTEGER,
ADD COLUMN     "summary" TEXT,
ALTER COLUMN "status" SET DEFAULT 'draft';

-- CreateTable
CREATE TABLE "ProgramEvent" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgramEvent_programId_createdAt_idx" ON "ProgramEvent"("programId", "createdAt");

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_archivedBy_fkey" FOREIGN KEY ("archivedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramEvent" ADD CONSTRAINT "ProgramEvent_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramEvent" ADD CONSTRAINT "ProgramEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

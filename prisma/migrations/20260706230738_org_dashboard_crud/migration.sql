/*
  Warnings:

  - The values [SUBMITTED,MORE_INFO_REQUESTED] on the enum `ApplicationStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `assignedToId` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `decision` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `decisionReason` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `internalNotes` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `programId` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedById` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `submittedAt` on the `Application` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `Organization` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ApplicationStatus_new" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WAITLISTED');
ALTER TABLE "Application" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Application" ALTER COLUMN "status" TYPE "ApplicationStatus_new" USING ("status"::text::"ApplicationStatus_new");
ALTER TYPE "ApplicationStatus" RENAME TO "ApplicationStatus_old";
ALTER TYPE "ApplicationStatus_new" RENAME TO "ApplicationStatus";
DROP TYPE "ApplicationStatus_old";
ALTER TABLE "Application" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_programId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_reviewedById_fkey";

-- DropForeignKey
ALTER TABLE "ApplicationEvent" DROP CONSTRAINT "ApplicationEvent_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentRequest" DROP CONSTRAINT "DocumentRequest_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "Program" DROP CONSTRAINT "Program_organizationId_fkey";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "assignedToId",
DROP COLUMN "data",
DROP COLUMN "decision",
DROP COLUMN "decisionReason",
DROP COLUMN "internalNotes",
DROP COLUMN "programId",
DROP COLUMN "reviewedAt",
DROP COLUMN "reviewedById",
DROP COLUMN "submittedAt";

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "emailFromName" TEXT DEFAULT 'Heloci',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "telegramChannelId" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "eligibilitySummary" TEXT,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "requiredDocuments" JSONB;

-- AlterTable
ALTER TABLE "ProgramApplication" ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "decision" TEXT,
ADD COLUMN     "decisionReason" TEXT,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT;

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_token_idx" ON "Invitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_organizationId_email_key" ON "Invitation"("organizationId", "email");

-- CreateIndex
CREATE INDEX "ProgramApplication_assignedToId_idx" ON "ProgramApplication"("assignedToId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramApplication" ADD CONSTRAINT "ProgramApplication_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramApplication" ADD CONSTRAINT "ProgramApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ProgramApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequest" ADD CONSTRAINT "DocumentRequest_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ProgramApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

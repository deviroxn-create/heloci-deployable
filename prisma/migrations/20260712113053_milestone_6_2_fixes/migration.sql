/*
  Warnings:

  - A unique constraint covering the columns `[messageId]` on the table `DocumentRequest` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `StaffNote` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "StaffNote" DROP CONSTRAINT "StaffNote_applicationId_fkey";

-- AlterTable
ALTER TABLE "DocumentRequest" ADD COLUMN     "messageId" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "preferences" JSONB;

-- AlterTable
ALTER TABLE "StaffNote" ADD COLUMN     "oldApplicationId" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "applicationId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CaseConversation" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "subject" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageFrom" TEXT,
    "applicantRead" BOOLEAN NOT NULL DEFAULT false,
    "applicantReadAt" TIMESTAMP(3),
    "staffRead" BOOLEAN NOT NULL DEFAULT false,
    "staffReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CaseConversation_applicationId_key" ON "CaseConversation"("applicationId");

-- CreateIndex
CREATE INDEX "CaseConversation_applicationId_idx" ON "CaseConversation"("applicationId");

-- CreateIndex
CREATE INDEX "CaseConversation_lastMessageAt_idx" ON "CaseConversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "CaseMessage_conversationId_createdAt_idx" ON "CaseMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseMessage_senderId_idx" ON "CaseMessage"("senderId");

-- CreateIndex
CREATE INDEX "MessageAttachment_messageId_idx" ON "MessageAttachment"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRequest_messageId_key" ON "DocumentRequest"("messageId");

-- CreateIndex
CREATE INDEX "StaffNote_applicationId_idx" ON "StaffNote"("applicationId");

-- CreateIndex
CREATE INDEX "StaffNote_authorId_idx" ON "StaffNote"("authorId");

-- AddForeignKey
ALTER TABLE "DocumentRequest" ADD CONSTRAINT "DocumentRequest_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "CaseMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseConversation" ADD CONSTRAINT "CaseConversation_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ProgramApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseMessage" ADD CONSTRAINT "CaseMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "CaseConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseMessage" ADD CONSTRAINT "CaseMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageAttachment" ADD CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "CaseMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffNote" ADD CONSTRAINT "StaffNote_oldApplicationId_fkey" FOREIGN KEY ("oldApplicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffNote" ADD CONSTRAINT "StaffNote_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ProgramApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

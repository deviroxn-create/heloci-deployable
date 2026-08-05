-- CreateEnum
CREATE TYPE "SenderVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'UNKNOWN');

-- AlterTable
ALTER TABLE "NotificationLog" ADD COLUMN     "senderIdentityId" TEXT;

-- AlterTable
ALTER TABLE "NotificationTemplate" ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "senderIdentityId" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "primarySenderId" TEXT;

-- CreateTable
CREATE TABLE "SenderIdentity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "department" TEXT,
    "replyTo" TEXT,
    "signature" TEXT,
    "logoUrl" TEXT,
    "themeColor" TEXT,
    "verificationStatus" "SenderVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3),
    "verificationError" TEXT,

    CONSTRAINT "SenderIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDraft" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "cc" TEXT[],
    "bcc" TEXT[],
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "templateId" TEXT,
    "templateData" JSONB,
    "lastSavedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SenderIdentity_organizationId_isActive_idx" ON "SenderIdentity"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "SenderIdentity_organizationId_isDefault_idx" ON "SenderIdentity"("organizationId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "SenderIdentity_organizationId_emailAddress_key" ON "SenderIdentity"("organizationId", "emailAddress");

-- CreateIndex
CREATE INDEX "EmailDraft_organizationId_authorId_idx" ON "EmailDraft"("organizationId", "authorId");

-- CreateIndex
CREATE INDEX "EmailDraft_createdAt_idx" ON "EmailDraft"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationLog_createdAt_idx" ON "NotificationLog"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationLog_eventName_deliveryStatus_idx" ON "NotificationLog"("eventName", "deliveryStatus");

-- CreateIndex
CREATE INDEX "NotificationLog_senderIdentityId_idx" ON "NotificationLog"("senderIdentityId");

-- CreateIndex
CREATE INDEX "NotificationTemplate_eventName_channel_active_idx" ON "NotificationTemplate"("eventName", "channel", "active");

-- CreateIndex
CREATE INDEX "Organization_createdAt_idx" ON "Organization"("createdAt");

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_senderIdentityId_fkey" FOREIGN KEY ("senderIdentityId") REFERENCES "SenderIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationTemplate" ADD CONSTRAINT "NotificationTemplate_senderIdentityId_fkey" FOREIGN KEY ("senderIdentityId") REFERENCES "SenderIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SenderIdentity" ADD CONSTRAINT "SenderIdentity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SenderIdentity" ADD CONSTRAINT "SenderIdentity_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDraft" ADD CONSTRAINT "EmailDraft_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDraft" ADD CONSTRAINT "EmailDraft_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

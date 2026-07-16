/*
  Warnings:

  - Added the required column `title` to the `NotificationTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationTemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "NotificationLog" ADD COLUMN     "maxRetries" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "nextRetryAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "NotificationTemplate" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "status" "NotificationTemplateStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "title" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ApplicantProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileData" JSONB NOT NULL,
    "completeness" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "channels" JSONB NOT NULL DEFAULT '{}',
    "senderEmail" TEXT NOT NULL DEFAULT 'support@heloci.ngo',
    "telegramBotToken" TEXT,
    "telegramChatId" TEXT,
    "events" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRetryAttempt" (
    "id" TEXT NOT NULL,
    "notificationLogId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "status" "NotificationDeliveryStatus" NOT NULL,
    "errorMessage" TEXT,
    "providerResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationRetryAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApplicantProfile_userId_key" ON "ApplicantProfile"("userId");

-- AddForeignKey
ALTER TABLE "ApplicantProfile" ADD CONSTRAINT "ApplicantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRetryAttempt" ADD CONSTRAINT "NotificationRetryAttempt_notificationLogId_fkey" FOREIGN KEY ("notificationLogId") REFERENCES "NotificationLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

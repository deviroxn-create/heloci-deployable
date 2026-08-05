-- CreateTable
CREATE TABLE "OrganizationCommunication" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderIdentityId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'email',
    "status" TEXT NOT NULL DEFAULT 'sent',
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationCommunication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationCommunicationRecipient" (
    "id" TEXT NOT NULL,
    "communicationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'delivered',
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),

    CONSTRAINT "OrganizationCommunicationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganizationCommunication_organizationId_idx" ON "OrganizationCommunication"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationCommunication_senderId_idx" ON "OrganizationCommunication"("senderId");

-- CreateIndex
CREATE INDEX "OrganizationCommunication_createdAt_idx" ON "OrganizationCommunication"("createdAt");

-- CreateIndex
CREATE INDEX "OrganizationCommunicationRecipient_communicationId_idx" ON "OrganizationCommunicationRecipient"("communicationId");

-- CreateIndex
CREATE INDEX "OrganizationCommunicationRecipient_email_idx" ON "OrganizationCommunicationRecipient"("email");

-- AddForeignKey
ALTER TABLE "OrganizationCommunication" ADD CONSTRAINT "OrganizationCommunication_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationCommunication" ADD CONSTRAINT "OrganizationCommunication_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationCommunication" ADD CONSTRAINT "OrganizationCommunication_senderIdentityId_fkey" FOREIGN KEY ("senderIdentityId") REFERENCES "SenderIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationCommunicationRecipient" ADD CONSTRAINT "OrganizationCommunicationRecipient_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "OrganizationCommunication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

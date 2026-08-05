-- CreateTable
CREATE TABLE "ReviewChecklist" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "completedItems" INTEGER NOT NULL DEFAULT 0,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewChecklistItem" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVerification" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseDecision" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "internalNotes" TEXT,
    "applicantMessage" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "decidedBy" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "templateUsed" TEXT,
    "conditions" JSONB,
    "supersededBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CaseDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseFlag" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT,
    "addedBy" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),
    "removedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CaseFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QAReview" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "decisionId" TEXT,
    "reviewerId" TEXT NOT NULL,
    "qaReviewerId" TEXT NOT NULL,
    "score" INTEGER,
    "comments" TEXT,
    "corrections" JSONB,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QAReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewChecklist_applicationId_key" ON "ReviewChecklist"("applicationId");

-- CreateIndex
CREATE INDEX "ReviewChecklist_applicationId_idx" ON "ReviewChecklist"("applicationId");

-- CreateIndex
CREATE INDEX "ReviewChecklistItem_checklistId_order_idx" ON "ReviewChecklistItem"("checklistId", "order");

-- CreateIndex
CREATE INDEX "ReviewChecklistItem_checklistId_completed_idx" ON "ReviewChecklistItem"("checklistId", "completed");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVerification_documentId_key" ON "DocumentVerification"("documentId");

-- CreateIndex
CREATE INDEX "DocumentVerification_documentId_idx" ON "DocumentVerification"("documentId");

-- CreateIndex
CREATE INDEX "DocumentVerification_status_idx" ON "DocumentVerification"("status");

-- CreateIndex
CREATE INDEX "CaseDecision_applicationId_isActive_idx" ON "CaseDecision"("applicationId", "isActive");

-- CreateIndex
CREATE INDEX "CaseDecision_decidedBy_idx" ON "CaseDecision"("decidedBy");

-- CreateIndex
CREATE INDEX "CaseDecision_decision_idx" ON "CaseDecision"("decision");

-- CreateIndex
CREATE INDEX "DecisionTemplate_organizationId_category_isActive_idx" ON "DecisionTemplate"("organizationId", "category", "isActive");

-- CreateIndex
CREATE INDEX "CaseFlag_applicationId_isActive_idx" ON "CaseFlag"("applicationId", "isActive");

-- CreateIndex
CREATE INDEX "CaseFlag_type_isActive_idx" ON "CaseFlag"("type", "isActive");

-- CreateIndex
CREATE INDEX "QAReview_applicationId_idx" ON "QAReview"("applicationId");

-- CreateIndex
CREATE INDEX "QAReview_reviewerId_idx" ON "QAReview"("reviewerId");

-- CreateIndex
CREATE INDEX "QAReview_qaReviewerId_idx" ON "QAReview"("qaReviewerId");

-- AddForeignKey
ALTER TABLE "ReviewChecklist" ADD CONSTRAINT "ReviewChecklist_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ProgramApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewChecklistItem" ADD CONSTRAINT "ReviewChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "ReviewChecklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewChecklistItem" ADD CONSTRAINT "ReviewChecklistItem_completedBy_fkey" FOREIGN KEY ("completedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVerification" ADD CONSTRAINT "DocumentVerification_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVerification" ADD CONSTRAINT "DocumentVerification_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseDecision" ADD CONSTRAINT "CaseDecision_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ProgramApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseDecision" ADD CONSTRAINT "CaseDecision_decidedBy_fkey" FOREIGN KEY ("decidedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionTemplate" ADD CONSTRAINT "DecisionTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionTemplate" ADD CONSTRAINT "DecisionTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseFlag" ADD CONSTRAINT "CaseFlag_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ProgramApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseFlag" ADD CONSTRAINT "CaseFlag_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseFlag" ADD CONSTRAINT "CaseFlag_removedBy_fkey" FOREIGN KEY ("removedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QAReview" ADD CONSTRAINT "QAReview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ProgramApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QAReview" ADD CONSTRAINT "QAReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QAReview" ADD CONSTRAINT "QAReview_qaReviewerId_fkey" FOREIGN KEY ("qaReviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

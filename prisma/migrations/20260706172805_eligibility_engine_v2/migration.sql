-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "housingGoal" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EligibilityRule" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL DEFAULT 'v1',
    "rules" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EligibilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EligibilityResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "isEligible" BOOLEAN NOT NULL,
    "score" INTEGER,
    "reason" JSONB NOT NULL,
    "ruleVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EligibilityResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Program_slug_key" ON "Program"("slug");

-- CreateIndex
CREATE INDEX "EligibilityRule_programId_isActive_idx" ON "EligibilityRule"("programId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "EligibilityRule_programId_version_key" ON "EligibilityRule"("programId", "version");

-- CreateIndex
CREATE INDEX "EligibilityResult_userId_idx" ON "EligibilityResult"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EligibilityResult_userId_programId_key" ON "EligibilityResult"("userId", "programId");

-- AddForeignKey
ALTER TABLE "EligibilityRule" ADD CONSTRAINT "EligibilityRule_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EligibilityResult" ADD CONSTRAINT "EligibilityResult_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "QuestionSet" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Application Form',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "questionSetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "placeholder" TEXT,
    "helpText" TEXT,
    "options" JSONB,
    "validation" JSONB,
    "sortOrder" INTEGER NOT NULL,
    "isUniversal" BOOLEAN NOT NULL DEFAULT false,
    "profileField" TEXT,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionCondition" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rules" JSONB NOT NULL,

    CONSTRAINT "QuestionCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "data" JSONB NOT NULL DEFAULT '{}',
    "currentPage" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionSet_programId_version_key" ON "QuestionSet"("programId", "version");

-- CreateIndex
CREATE INDEX "QuestionSet_programId_isActive_idx" ON "QuestionSet"("programId", "isActive");

-- CreateIndex
CREATE INDEX "Page_questionSetId_sortOrder_idx" ON "Page"("questionSetId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Question_pageId_key_key" ON "Question"("pageId", "key");

-- CreateIndex
CREATE INDEX "Question_pageId_sortOrder_idx" ON "Question"("pageId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramApplication_userId_programId_key" ON "ProgramApplication"("userId", "programId");

-- CreateIndex
CREATE INDEX "ProgramApplication_userId_status_idx" ON "ProgramApplication"("userId", "status");

-- CreateIndex
CREATE INDEX "ProgramApplication_programId_status_idx" ON "ProgramApplication"("programId", "status");

-- AddForeignKey
ALTER TABLE "QuestionSet" ADD CONSTRAINT "QuestionSet_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionCondition" ADD CONSTRAINT "QuestionCondition_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramApplication" ADD CONSTRAINT "ProgramApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramApplication" ADD CONSTRAINT "ProgramApplication_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

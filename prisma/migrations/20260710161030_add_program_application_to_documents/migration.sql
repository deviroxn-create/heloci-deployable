-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_applicationId_fkey";

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "programApplicationId" TEXT,
ALTER COLUMN "applicationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_programApplicationId_fkey" FOREIGN KEY ("programApplicationId") REFERENCES "ProgramApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

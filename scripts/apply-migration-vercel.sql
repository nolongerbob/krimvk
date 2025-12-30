-- Миграция для создания таблицы application_files на Vercel
-- Выполните этот SQL скрипт в базе данных Vercel через интерфейс или CLI

-- CreateTable
CREATE TABLE IF NOT EXISTS "application_files" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "application_files_applicationId_idx" ON "application_files"("applicationId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'application_files_applicationId_fkey'
    ) THEN
        ALTER TABLE "application_files" 
        ADD CONSTRAINT "application_files_applicationId_fkey" 
        FOREIGN KEY ("applicationId") 
        REFERENCES "applications"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


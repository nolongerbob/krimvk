-- Скрипт для создания таблицы password_reset_tokens в Neon
-- Выполните этот SQL скрипт в базе данных Neon через интерфейс или CLI

-- CreateTable
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- AddForeignKey
-- Проверяем существование constraint перед добавлением
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'password_reset_tokens_userId_fkey' 
        AND table_name = 'password_reset_tokens'
    ) THEN
        ALTER TABLE "password_reset_tokens" 
        ADD CONSTRAINT "password_reset_tokens_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

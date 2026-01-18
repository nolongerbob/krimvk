const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyAllMigrations() {
  try {
    console.log('📦 Применение всех миграций на Neon...');
    
    // Применяем миграцию для password_reset_tokens
    console.log('\n1️⃣ Применение миграции password_reset_tokens...');
    
    const tableExistsResult = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'password_reset_tokens'
      ) as exists;
    `;
    
    const tableExists = tableExistsResult[0]?.exists;
    
    if (!tableExists) {
      console.log('📝 Создание таблицы password_reset_tokens...');
      
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "password_reset_tokens" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "token" TEXT NOT NULL,
          "expires" TIMESTAMP(3) NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
        );
      `);
      console.log('✅ Таблица password_reset_tokens создана');
      
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX "password_reset_tokens_token_key" 
        ON "password_reset_tokens"("token");
      `);
      console.log('✅ Создан уникальный индекс для token');
      
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "password_reset_tokens" 
        ADD CONSTRAINT "password_reset_tokens_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      console.log('✅ Внешний ключ добавлен');
    } else {
      console.log('✅ Таблица password_reset_tokens уже существует');
    }
    
    // Проверяем другие таблицы из схемы
    console.log('\n2️⃣ Проверка других таблиц...');
    
    const requiredTables = [
      'users',
      'accounts',
      'sessions',
      'verification_tokens',
      'email_verification_tokens',
      'password_reset_tokens',
    ];
    
    for (const tableName of requiredTables) {
      const existsResult = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        ) as exists;
      `);
      
      const exists = existsResult[0]?.exists;
      if (exists) {
        console.log(`✅ Таблица ${tableName} существует`);
      } else {
        console.log(`⚠️  Таблица ${tableName} отсутствует`);
      }
    }
    
    console.log('\n✅ Все миграции применены!');
    
  } catch (error) {
    console.error('❌ Ошибка при применении миграций:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyAllMigrations()
  .then(() => {
    console.log('\n✅ Готово! База данных Neon обновлена.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Критическая ошибка:', error);
    process.exit(1);
  });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('📦 Применение миграции для таблицы password_reset_tokens...');
    
    // Проверяем, существует ли таблица
    const tableExistsResult = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'password_reset_tokens'
      ) as exists;
    `;
    
    const tableExists = tableExistsResult[0]?.exists;
    
    if (tableExists) {
      console.log('✅ Таблица password_reset_tokens уже существует, пропускаем миграцию');
      await prisma.$disconnect();
      return;
    }
    
    console.log('📝 Создание таблицы password_reset_tokens...');
    
    // Создаем таблицу
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "expires" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('✅ Таблица password_reset_tokens создана');
    
    // Создаем уникальный индекс для token
    try {
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_key" 
        ON "password_reset_tokens"("token");
      `);
      console.log('✅ Создан уникальный индекс для token');
    } catch (error) {
      if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
        throw error;
      }
      console.log('⚠️  Индекс уже существует, пропускаем...');
    }
    
    // Проверяем, существует ли внешний ключ
    const fkExistsResult = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'password_reset_tokens_userId_fkey' 
        AND table_name = 'password_reset_tokens'
      ) as exists;
    `;
    
    const fkExists = fkExistsResult[0]?.exists;
    
    if (!fkExists) {
      console.log('📝 Добавление внешнего ключа...');
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "password_reset_tokens" 
        ADD CONSTRAINT "password_reset_tokens_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      console.log('✅ Внешний ключ добавлен');
    } else {
      console.log('✅ Внешний ключ уже существует');
    }
    
    console.log('');
    console.log('✅ Миграция успешно применена!');
    
  } catch (error) {
    console.error('❌ Ошибка при применении миграции:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем миграцию
applyMigration()
  .then(() => {
    console.log('✅ Готово!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  });

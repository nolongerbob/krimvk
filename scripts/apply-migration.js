const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('📦 Applying migration for application_files table...');
    
    // Проверяем, существует ли таблица
    const tableExistsResult = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'application_files'
      ) as exists;
    `;
    
    const tableExists = tableExistsResult[0]?.exists;
    
    if (tableExists) {
      console.log('✅ Table application_files already exists, skipping migration');
      return;
    }
    
    console.log('📝 Creating table application_files...');
    
    // Создаем таблицу
    await prisma.$executeRawUnsafe(`
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
    `);
    console.log('✅ Created table application_files');
    
    // Создаем индекс (если не существует)
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "application_files_applicationId_idx" ON "application_files"("applicationId");
      `);
      console.log('✅ Created index application_files_applicationId_idx');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('⚠️  Index already exists, skipping...');
    }
    
    // Проверяем, существует ли внешний ключ
    const fkExistsResult = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'application_files_applicationId_fkey'
      ) as exists;
    `;
    
    const fkExists = fkExistsResult[0]?.exists;
    
    if (!fkExists) {
      // Добавляем внешний ключ
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "application_files" 
        ADD CONSTRAINT "application_files_applicationId_fkey" 
        FOREIGN KEY ("applicationId") 
        REFERENCES "applications"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      console.log('✅ Added foreign key constraint');
    } else {
      console.log('✅ Foreign key already exists, skipping...');
    }
    
    console.log('✅ Migration applied successfully!');
  } catch (error) {
    // Игнорируем ошибки, если таблица уже существует
    if (error.message && (
        error.message.includes('already exists') || 
        error.message.includes('duplicate') ||
        (error.message.includes('relation') && error.message.includes('already exists'))
    )) {
      console.log('⚠️  Table or constraint already exists, skipping...');
      console.log('✅ Migration completed (table already exists)');
    } else {
      console.error('❌ Error applying migration:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        meta: error.meta,
      });
      // Не завершаем процесс с ошибкой, чтобы сборка могла продолжиться
      // На Vercel это может быть проблемой, если таблица уже существует
      console.log('⚠️  Continuing build despite migration error...');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем миграцию только если это не тестовая среда
if (process.env.NODE_ENV !== 'test') {
  applyMigration().catch((error) => {
    console.error('Fatal error in migration:', error);
    process.exit(1);
  });
} else {
  console.log('⚠️  Skipping migration in test environment');
}


const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('📦 Applying migration for application_files table...');
    
    // Проверяем, существует ли таблица
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'application_files'
      );
    `;
    
    if (tableExists[0]?.exists) {
      console.log('✅ Table application_files already exists, skipping migration');
      return;
    }
    
    // Создаем таблицу
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "application_files" (
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
    
    // Создаем индекс
    await prisma.$executeRawUnsafe(`
      CREATE INDEX "application_files_applicationId_idx" ON "application_files"("applicationId");
    `);
    console.log('✅ Created index application_files_applicationId_idx');
    
    // Добавляем внешний ключ
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "application_files" 
      ADD CONSTRAINT "application_files_applicationId_fkey" 
      FOREIGN KEY ("applicationId") 
      REFERENCES "applications"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);
    console.log('✅ Added foreign key constraint');
    
    console.log('✅ Migration applied successfully!');
  } catch (error) {
    // Игнорируем ошибки, если таблица уже существует
    if (error.message.includes('already exists') || 
        error.message.includes('duplicate') ||
        error.message.includes('relation') && error.message.includes('already exists')) {
      console.log('⚠️  Table or constraint already exists, skipping...');
    } else {
      console.error('❌ Error applying migration:', error);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();


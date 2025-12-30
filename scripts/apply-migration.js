const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('📦 Applying migration for application_files table...');
    
    // Читаем SQL из миграции
    const migrationPath = path.join(__dirname, '../prisma/migrations/20241230_add_application_files/migration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    // Разбиваем SQL на отдельные команды
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    // Выполняем каждую команду
    for (const command of commands) {
      if (command) {
        try {
          await prisma.$executeRawUnsafe(command);
          console.log(`✅ Executed: ${command.substring(0, 50)}...`);
        } catch (error) {
          // Игнорируем ошибки, если таблица уже существует
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`⚠️  Skipped (already exists): ${command.substring(0, 50)}...`);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();


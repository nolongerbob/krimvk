const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Читаем .env файл
const envPath = path.join(__dirname, '..', '.env');
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Парсим DATABASE_URL
const dbUrlMatch = envContent.match(/DATABASE_URL="?([^"]+)"?/);
const dbUrl = dbUrlMatch ? dbUrlMatch[1] : 'postgresql://localhost:5432/postgres?schema=public';

// Извлекаем параметры подключения
const url = new URL(dbUrl);
const host = url.hostname || 'localhost';
const port = url.port || 5432;
const database = 'postgres'; // Подключаемся к postgres для создания новой базы
const user = url.username || process.env.USER || 'postgres';
const password = url.password || '';

console.log('🔧 Попытка создать базу данных krimvk...');
console.log(`Подключение: ${user}@${host}:${port}/${database}`);

const clientConfig = {
  host,
  port: parseInt(port),
  database,
  user,
};

// Добавляем пароль только если он есть
if (password) {
  clientConfig.password = password;
}

const client = new Client(clientConfig);

async function createDatabase() {
  try {
    await client.connect();
    console.log('✅ Подключено к PostgreSQL');

    // Проверяем, существует ли база
    const checkResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'krimvk'"
    );

    if (checkResult.rows.length > 0) {
      console.log('ℹ️  База данных krimvk уже существует');
      await client.end();
      return;
    }

    // Создаем базу данных
    await client.query('CREATE DATABASE krimvk');
    console.log('✅ База данных krimvk успешно создана!');
    
    await client.end();
    
    // Теперь применяем схему
    console.log('\n📋 Применяем схему Prisma...');
    const { execSync } = require('child_process');
    execSync('npm run db:push', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Попробуйте обновить DATABASE_URL в .env:');
      console.log('   DATABASE_URL="postgresql://username:password@localhost:5432/krimvk?schema=public"');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Убедитесь, что PostgreSQL запущен');
    } else {
      console.log('\n💡 Создайте базу вручную через графический клиент PostgreSQL');
    }
    
    process.exit(1);
  }
}

createDatabase();


const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnectionStability() {
  try {
    console.log('🔍 Тест стабильности соединения...\n');
    
    await prisma.$connect();
    console.log('✅ Подключено');
    
    // Делаем запрос
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Первый запрос OK');
    
    // Ждем 10 секунд (имитация idle)
    console.log('⏳ Жду 10 секунд (idle)...');
    await new Promise(r => setTimeout(r, 10000));
    
    // Пробуем запрос после idle
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Запрос после 10 сек idle: OK');
    } catch (e) {
      console.log('❌ Ошибка после idle:', e.message);
      console.log('Код:', e.code);
    }
    
    // Ждем еще 20 секунд
    console.log('⏳ Жду еще 20 секунд...');
    await new Promise(r => setTimeout(r, 20000));
    
    // Пробуем еще раз
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Запрос после 30 сек idle: OK');
    } catch (e) {
      console.log('❌ Ошибка после долгого idle:', e.message);
      console.log('Код:', e.code);
    }
    
    await prisma.$disconnect();
    console.log('\n✅ Тест завершен');
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
    console.error('Код:', error.code);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

testConnectionStability();




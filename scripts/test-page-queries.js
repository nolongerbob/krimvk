const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRealQueries() {
  try {
    console.log('🔍 Тестирование реальных запросов как на страницах...\n');
    
    // Тест 1: Новости (как на главной)
    console.log('1. Запрос новостей (как на главной)...');
    try {
      const news = await prisma.news.findMany({
        where: { published: true },
        include: {
          author: { select: { name: true, email: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 6,
      });
      console.log(`   ✅ Найдено: ${news.length} новостей`);
      if (news.length > 0) {
        console.log(`   📰 Первая: ${news[0].title.substring(0, 50)}...`);
      } else {
        console.log('   ⚠️  Новостей нет в БД');
      }
    } catch (e) {
      console.log(`   ❌ Ошибка: ${e.message}`);
    }

    // Тест 2: Услуги
    console.log('2. Запрос услуг...');
    try {
      const services = await prisma.service.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      console.log(`   ✅ Найдено: ${services.length} услуг`);
      if (services.length > 0) {
        console.log(`   🔧 Первая: ${services[0].title}`);
      } else {
        console.log('   ⚠️  Услуг нет в БД');
      }
    } catch (e) {
      console.log(`   ❌ Ошибка: ${e.message}`);
    }

    // Тест 3: Страницы
    console.log('3. Запрос страниц...');
    try {
      const pages = await prisma.page.findMany({
        where: { isActive: true },
        take: 3,
      });
      console.log(`   ✅ Найдено: ${pages.length} страниц`);
      if (pages.length > 0) {
        console.log(`   📄 Первая: ${pages[0].title} (${pages[0].slug})`);
      } else {
        console.log('   ⚠️  Страниц нет в БД');
      }
    } catch (e) {
      console.log(`   ❌ Ошибка: ${e.message}`);
    }

    await prisma.$disconnect();
    console.log('\n✅ Тест завершен');
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
    process.exit(1);
  }
}

testRealQueries();




const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDB() {
  try {
    console.log('🔍 Проверка подключения...');
    await prisma.$connect();
    console.log('✅ Подключение успешно\n');

    console.log('🔍 Проверка таблиц...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log(`✅ Найдено таблиц: ${tables.length}`);
    tables.slice(0, 15).forEach(t => console.log(`   - ${t.table_name}`));
    if (tables.length > 15) console.log(`   ... и ещё ${tables.length - 15}`);
    console.log('');

    console.log('🔍 Проверка основных таблиц...');
    const checks = [
      { name: 'users', query: () => prisma.user.count() },
      { name: 'news', query: () => prisma.news.count() },
      { name: 'services', query: () => prisma.service.count() },
      { name: 'applications', query: () => prisma.application.count() },
      { name: 'pages', query: () => prisma.page.count() },
      { name: 'posts', query: () => prisma.post.count() },
      { name: 'questions', query: () => prisma.question.count() },
      { name: 'userAccounts', query: () => prisma.userAccount.count() },
      { name: 'waterQualityDistricts', query: () => prisma.waterQualityDistrict.count() },
      { name: 'disclosureDocuments', query: () => prisma.disclosureDocument.count() },
    ];

    for (const check of checks) {
      try {
        const count = await check.query();
        console.log(`✅ ${check.name}: ${count} записей`);
      } catch (e) {
        console.log(`❌ ${check.name}: ошибка - ${e.message}`);
      }
    }

    console.log('\n🔍 Тестирование запросов...');
    
    // Тест 1: Новости
    try {
      const news = await prisma.news.findMany({ take: 1 });
      console.log('✅ Запрос новостей: OK');
    } catch (e) {
      console.log(`❌ Запрос новостей: ${e.message}`);
    }

    // Тест 2: Услуги
    try {
      const services = await prisma.service.findMany({ take: 1 });
      console.log('✅ Запрос услуг: OK');
    } catch (e) {
      console.log(`❌ Запрос услуг: ${e.message}`);
    }

    // Тест 3: Страницы
    try {
      const pages = await prisma.page.findMany({ take: 1 });
      console.log('✅ Запрос страниц: OK');
    } catch (e) {
      console.log(`❌ Запрос страниц: ${e.message}`);
    }

    // Тест 4: Пользователи
    try {
      const users = await prisma.user.findMany({ take: 1 });
      console.log('✅ Запрос пользователей: OK');
    } catch (e) {
      console.log(`❌ Запрос пользователей: ${e.message}`);
    }

    console.log('\n🔍 Тест пула соединений...');
    const promises = Array.from({ length: 5 }, (_, i) => 
      prisma.$queryRaw`SELECT 1 as test`.then(() => {
        console.log(`  ✅ Запрос ${i + 1} выполнен`);
      }).catch(e => {
        console.log(`  ❌ Запрос ${i + 1} ошибка: ${e.message}`);
      })
    );
    await Promise.all(promises);

    console.log('\n✅ База данных работает нормально!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkDB();




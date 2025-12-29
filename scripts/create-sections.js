const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Создаю разделы сайта...\n');

  // Находим админа (или создаем временного)
  let admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!admin) {
    console.log('⚠️  Админ не найден. Создаю временного админа...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    admin = await prisma.user.create({
      data: {
        email: 'admin@krimvk.ru',
        password: hashedPassword,
        name: 'Администратор',
        role: 'ADMIN',
      },
    });
    console.log('✅ Админ создан\n');
  }

  // Структура разделов на основе навигации
  const sections = [
    // Абонентам
    {
      title: 'Абонентам',
      slug: '/abonenty',
      description: 'Информация для абонентов',
      isCategory: true,
      order: 1,
      children: [
        {
          title: 'Платные услуги',
          slug: '/abonenty/platy-uslugi',
          description: 'Платные услуги компании',
          isCategory: true,
          order: 1,
          children: [
            {
              title: 'Заявка на откачку сточных вод',
              slug: '/abonenty/platy-uslugi/otkachka',
              description: 'Подача заявки на откачку сточных вод',
              isCategory: true,
              order: 1,
            },
            {
              title: 'Подключение',
              slug: '/abonenty/platy-uslugi/podklyuchenie',
              description: 'Подключение к водоснабжению и канализации',
              isCategory: true,
              order: 2,
            },
          ],
        },
        {
          title: 'Порядок заключения договора',
          slug: '/abonenty/poryadok-zaklyucheniya-dogovora',
          description: 'Порядок заключения договора',
          isCategory: true,
          order: 2,
        },
        {
          title: 'Тарифы на подключение и расчет стоимости',
          slug: '/abonenty/tarify-podklyuchenie',
          description: 'Тарифы на подключение',
          isCategory: true,
          order: 3,
        },
        {
          title: 'Тарифы на проектирование',
          slug: '/abonenty/tarify-proektirovanie',
          description: 'Тарифы на проектирование',
          isCategory: true,
          order: 4,
        },
        {
          title: 'Технологическое присоединение',
          slug: '/abonenty/tehnologicheskoe-prisoedinenie',
          description: 'Технологическое присоединение',
          isCategory: true,
          order: 5,
        },
      ],
    },
    // О компании
    {
      title: 'О компании',
      slug: '/o-kompanii',
      description: 'Информация о компании',
      isCategory: true,
      order: 2,
      children: [
        {
          title: 'Руководство',
          slug: '/o-kompanii/rukovodstvo',
          description: 'Руководство компании',
          isCategory: true,
          order: 1,
        },
        {
          title: 'Вакансии',
          slug: '/o-kompanii/vakansii',
          description: 'Вакансии компании',
          isCategory: true,
          order: 2,
        },
        {
          title: 'История предприятия',
          slug: '/o-kompanii/istoriya',
          description: 'История предприятия',
          isCategory: true,
          order: 3,
        },
        {
          title: 'Лицензии и заключения',
          slug: '/o-kompanii/licenzii',
          description: 'Лицензии и заключения',
          isCategory: true,
          order: 4,
        },
        {
          title: 'Развитие',
          slug: '/o-kompanii/razvitie',
          description: 'Развитие компании',
          isCategory: true,
          order: 5,
        },
        {
          title: 'Раскрытие информации',
          slug: '/o-kompanii/raskrytie',
          description: 'Раскрытие информации',
          isCategory: true,
          order: 6,
          children: [
            {
              title: 'Учредительные документы',
              slug: '/o-kompanii/raskrytie/uchreditelnye-dokumenty',
              description: 'Учредительные документы',
              isCategory: true,
              order: 1,
            },
            {
              title: 'Нормативные документы',
              slug: '/o-kompanii/raskrytie/normativnye-dokumenty',
              description: 'Нормативные документы',
              isCategory: true,
              order: 2,
            },
            {
              title: 'Информация, подлежащая раскрытию',
              slug: '/o-kompanii/raskrytie/informaciya-raskrytie',
              description: 'Информация, подлежащая раскрытию',
              isCategory: true,
              order: 3,
            },
            {
              title: 'Защита персональных данных',
              slug: '/o-kompanii/raskrytie/zashchita-personalnyh-dannyh',
              description: 'Защита персональных данных',
              isCategory: true,
              order: 4,
            },
            {
              title: 'Антикоррупционная политика',
              slug: '/o-kompanii/raskrytie/antikorrupciya',
              description: 'Антикоррупционная политика',
              isCategory: true,
              order: 5,
            },
            {
              title: 'Инвестиционная программа',
              slug: '/o-kompanii/raskrytie/investicionnaya-programma',
              description: 'Инвестиционная программа',
              isCategory: true,
              order: 6,
            },
          ],
        },
        {
          title: 'Водоснабжение',
          slug: '/o-kompanii/vodosnabzhenie',
          description: 'Водоснабжение',
          isCategory: true,
          order: 7,
          children: [
            {
              title: 'Структура водоснабжения',
              slug: '/o-kompanii/vodosnabzhenie/struktura',
              description: 'Структура водоснабжения',
              isCategory: true,
              order: 1,
            },
            {
              title: 'Качество воды',
              slug: '/o-kompanii/vodosnabzhenie/kachestvo-vody',
              description: 'Качество воды',
              isCategory: true,
              order: 2,
            },
          ],
        },
        {
          title: 'Канализование',
          slug: '/o-kompanii/kanalizovanie',
          description: 'Канализование',
          isCategory: true,
          order: 8,
          children: [
            {
              title: 'Структура канализования',
              slug: '/o-kompanii/kanalizovanie/struktura',
              description: 'Структура канализования',
              isCategory: true,
              order: 1,
            },
            {
              title: 'Защита рек',
              slug: '/o-kompanii/kanalizovanie/zashchita-rek',
              description: 'Защита рек',
              isCategory: true,
              order: 2,
            },
            {
              title: 'Защита Черного моря',
              slug: '/o-kompanii/kanalizovanie/zashchita-chernogo-morya',
              description: 'Защита Черного моря',
              isCategory: true,
              order: 3,
            },
          ],
        },
      ],
    },
  ];

  async function createPage(pageData, parentId = null) {
    // Проверяем, существует ли уже страница с таким slug
    const existing = await prisma.page.findUnique({
      where: { slug: pageData.slug },
    });

    if (existing) {
      console.log(`⏭️  Уже существует: ${pageData.title} (${pageData.slug})`);
      // Обновляем, если нужно
      if (!existing.isCategory) {
        await prisma.page.update({
          where: { id: existing.id },
          data: { isCategory: true },
        });
        console.log(`   ✅ Обновлено: помечено как категория`);
      }
      return existing.id;
    }

    const page = await prisma.page.create({
      data: {
        title: pageData.title,
        slug: pageData.slug,
        description: pageData.description || null,
        content: null,
        parentId: parentId,
        order: pageData.order || 0,
        isActive: true,
        isCategory: pageData.isCategory || false,
        authorId: admin.id,
      },
    });

    console.log(`✅ Создано: ${pageData.title} (${pageData.slug})`);
    return page.id;
  }

  async function createPagesRecursive(pages, parentId = null) {
    for (const pageData of pages) {
      const pageId = await createPage(pageData, parentId);
      if (pageData.children && pageData.children.length > 0) {
        await createPagesRecursive(pageData.children, pageId);
      }
    }
  }

  await createPagesRecursive(sections);

  console.log('\n✨ Готово! Все разделы созданы и помечены как категории для постов.');
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });






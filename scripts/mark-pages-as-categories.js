const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Ищу разделы для обновления...\n');

  // Находим все активные страницы, которые могут быть категориями
  // (например, разделы "Абонентам" и "О компании" и их подразделы)
  const pages = await prisma.page.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      isCategory: true,
    },
  });

  console.log(`Найдено страниц: ${pages.length}\n`);

  // Обновляем все найденные страницы, чтобы они стали категориями
  let updated = 0;
  for (const page of pages) {
    if (!page.isCategory) {
      await prisma.page.update({
        where: { id: page.id },
        data: { isCategory: true },
      });
      console.log(`✅ Обновлено: ${page.title} (${page.slug})`);
      updated++;
    } else {
      console.log(`⏭️  Уже категория: ${page.title} (${page.slug})`);
    }
  }

  console.log(`\n✨ Готово! Обновлено страниц: ${updated}`);
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });






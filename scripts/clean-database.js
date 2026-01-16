const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Начинаем очистку базы данных...\n');

  try {
    // Удаляем в порядке, обратном зависимостям (от дочерних к родительским)
    
    console.log('1. Удаляем документы договоров...');
    await prisma.contractDocument.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('2. Удаляем договоры...');
    await prisma.contract.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('3. Удаляем документы качества воды...');
    await prisma.waterQualityDocument.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('4. Удаляем годы качества воды...');
    await prisma.waterQualityYear.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('5. Удаляем города качества воды...');
    await prisma.waterQualityCity.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('6. Удаляем районы качества воды...');
    await prisma.waterQualityDistrict.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('7. Удаляем документы раскрытия информации...');
    await prisma.disclosureDocument.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('8. Удаляем сообщения об авариях...');
    await prisma.emergencyReport.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('9. Удаляем файлы постов...');
    await prisma.postFile.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('10. Удаляем посты...');
    await prisma.post.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('11. Удаляем страницы...');
    await prisma.page.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('12. Удаляем сообщения в диалогах...');
    await prisma.message.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('13. Удаляем вопросы/диалоги...');
    await prisma.question.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('14. Удаляем новости...');
    await prisma.news.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('15. Удаляем показания счетчиков...');
    await prisma.meterReading.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('16. Удаляем счетчики воды...');
    await prisma.waterMeter.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('17. Удаляем лицевые счета...');
    await prisma.userAccount.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('18. Удаляем счета за воду...');
    await prisma.bill.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('19. Удаляем файлы заявок...');
    await prisma.applicationFile.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('20. Удаляем заявки на услуги...');
    await prisma.application.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('21. Удаляем услуги...');
    await prisma.service.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('22. Удаляем токены подтверждения email...');
    await prisma.emailVerificationToken.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('23. Удаляем сессии NextAuth...');
    await prisma.session.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('24. Удаляем аккаунты NextAuth...');
    await prisma.account.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('25. Удаляем токены верификации NextAuth...');
    await prisma.verificationToken.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('26. Удаляем пользователей...');
    await prisma.user.deleteMany({});
    console.log('   ✅ Удалено');

    console.log('\n✨ База данных успешно очищена!');
    console.log('📊 Все таблицы пусты, структура сохранена.\n');

  } catch (error) {
    console.error('❌ Ошибка при очистке базы данных:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем очистку
cleanDatabase()
  .catch((error) => {
    console.error('Критическая ошибка:', error);
    process.exit(1);
  });

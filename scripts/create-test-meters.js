const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Создание тестовых счетчиков...\n');

  // Находим тестовых пользователей
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ['user1@test.ru', 'user2@test.ru', 'user3@test.ru'],
      },
    },
  });

  if (users.length === 0) {
    console.log('❌ Тестовые пользователи не найдены. Сначала создайте их.');
    return;
  }

  const metersData = [
    {
      type: 'холодная',
      serialNumber: 'ХВС-001234',
      address: 'г. Симферополь, ул. Ленина, д. 10, кв. 10',
      lastReading: 1250.5,
    },
    {
      type: 'горячая',
      serialNumber: 'ГВС-005678',
      address: 'г. Симферополь, ул. Ленина, д. 10, кв. 10',
      lastReading: 850.3,
    },
  ];

  for (const user of users) {
    console.log(`\n👤 Пользователь: ${user.email} (${user.name || 'Без имени'})`);
    
    for (const meterData of metersData) {
      try {
        // Проверяем, существует ли счетчик
        const existing = await prisma.waterMeter.findUnique({
          where: { serialNumber: `${meterData.serialNumber}-${user.id.slice(0, 8)}` },
        });

        if (existing) {
          console.log(`  ⏭️  Счетчик уже существует: ${meterData.serialNumber}`);
          continue;
        }

        // Создаем счетчик
        const meter = await prisma.waterMeter.create({
          data: {
            userId: user.id,
            serialNumber: `${meterData.serialNumber}-${user.id.slice(0, 8)}`,
            address: user.address || meterData.address,
            type: meterData.type,
            lastReading: meterData.lastReading,
          },
        });

        // Создаем начальное показание
        await prisma.meterReading.create({
          data: {
            meterId: meter.id,
            value: meterData.lastReading,
            readingDate: new Date(),
          },
        });

        console.log(`  ✅ Создан счетчик: ${meterData.type} (${meter.serialNumber})`);
        console.log(`     Последние показания: ${meterData.lastReading} м³`);
      } catch (error) {
        console.error(`  ❌ Ошибка при создании счетчика:`, error.message);
      }
    }
  }

  console.log('\n✨ Готово!');
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });






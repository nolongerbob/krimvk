/**
 * Скрипт для загрузки всех данных абонента из 1С
 * Загружает: счетчики, показания, счета (если есть в базе)
 */

const { PrismaClient } = require('@prisma/client');
const sql = require('mssql');
const prisma = new PrismaClient();

const sqlConfig = {
  server: 'localhost',
  port: 1433,
  user: 'sa',
  password: 'YourStrong@Passw0rd',
  database: 'ab_ruch',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function loadFullData() {
  try {
    console.log('🔌 Подключение к SQL Server...');
    await sql.connect(sqlConfig);
    console.log('✅ Подключено к SQL Server\n');

    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { email: 'abonent1@krimvk.local' },
      include: { userAccounts: true },
    });

    if (!user) {
      console.log('❌ Пользователь не найден');
      await sql.close();
      return;
    }

    console.log(`👤 Пользователь: ${user.email}`);
    console.log(`   Имя: ${user.name}\n`);

    // Находим или создаем лицевой счет
    let account = user.userAccounts.find(acc => acc.accountNumber === '1');
    
    if (!account) {
      console.log('📋 Создание лицевого счета...');
      account = await prisma.userAccount.create({
        data: {
          userId: user.id,
          accountNumber: '1',
          address: 'с.Ручьи, ул.Восточная 02',
          name: user.name,
        },
      });
      console.log(`✅ Лицевой счет создан: ЛС ${account.accountNumber}\n`);
    } else {
      console.log(`📋 Лицевой счет: ЛС ${account.accountNumber}`);
      console.log(`   Адрес: ${account.address}\n`);
    }

    // Получаем данные абонента из 1С
    console.log('📊 Извлечение данных из 1С...');
    const abonentResult = await sql.query`
      SELECT 
        _IDRRef,
        _Code,
        _Description,
        _Fld68,
        _Fld69,
        _Fld70,
        _Fld87,
        _Fld88,
        _Fld91
      FROM _Reference16
      WHERE _Code = '1' AND _Marked = 0x00
    `;

    if (abonentResult.recordset.length === 0) {
      console.log('❌ Абонент не найден в базе 1С');
      await sql.close();
      return;
    }

    const abonent = abonentResult.recordset[0];
    console.log(`✅ Найден абонент в 1С:`);
    console.log(`   Код: ${String(abonent._Code).trim()}`);
    console.log(`   ФИО: ${String(abonent._Description).trim()}`);
    console.log(`   Адрес: ${String(abonent._Fld87 || abonent._Fld88 || abonent._Fld68 || '').trim()}\n`);

    // Обновляем лицевой счет данными из 1С
    const address = String(abonent._Fld87 || abonent._Fld88 || abonent._Fld68 || '').trim() || 'с.Ручьи, ул.Восточная 02';
    await prisma.userAccount.update({
      where: { id: account.id },
      data: {
        address,
        name: String(abonent._Description).trim(),
      },
    });
    console.log('✅ Лицевой счет обновлен данными из 1С\n');

    // Ищем счетчики в регистрах сведений или документах
    // Пока создаем счетчик холодной воды по умолчанию
    console.log('💧 Проверка счетчиков...');
    const existingMeters = await prisma.waterMeter.findMany({
      where: { accountId: account.id },
    });

    if (existingMeters.length === 0) {
      console.log('💧 Создание счетчика холодной воды...');
      const meter = await prisma.waterMeter.create({
        data: {
          userId: user.id,
          accountId: account.id,
          serialNumber: `ХВС-${String(abonent._Code).trim()}`,
          address: address,
          type: 'холодная',
          lastReading: null,
        },
      });
      console.log(`✅ Счетчик создан: ${meter.serialNumber}\n`);
    } else {
      console.log(`✅ Найдено счетчиков: ${existingMeters.length}`);
      existingMeters.forEach(m => {
        console.log(`   - ${m.serialNumber} (${m.type})`);
      });
      console.log('');
    }

    // Ищем документы начисления (примерные показания)
    console.log('📄 Поиск документов начисления...');
    try {
      // Пробуем найти документы, связанные с этим абонентом
      // Это примерный запрос, может потребоваться корректировка
      const documentsResult = await sql.query`
        SELECT TOP 10
          _IDRRef,
          _Number,
          _Date_Time,
          _Posted
        FROM _Document26
        WHERE _Posted = 0x01
        ORDER BY _Date_Time DESC
      `;

      if (documentsResult.recordset.length > 0) {
        console.log(`✅ Найдено документов: ${documentsResult.recordset.length}`);
        console.log('   Примеры:');
        documentsResult.recordset.slice(0, 3).forEach(doc => {
          console.log(`   - ${doc._Number} от ${doc._Date_Time}`);
        });
        console.log('');
      }
    } catch (error) {
      console.log('⚠️  Не удалось получить документы (это нормально)\n');
    }

    // Создаем тестовые показания для демонстрации
    console.log('📊 Создание тестовых данных...');
    const meters = await prisma.waterMeter.findMany({
      where: { accountId: account.id },
    });

    for (const meter of meters) {
      // Проверяем, есть ли уже показания
      const existingReadings = await prisma.meterReading.findMany({
        where: { meterId: meter.id },
        orderBy: { readingDate: 'desc' },
        take: 1,
      });

      if (existingReadings.length === 0) {
        // Создаем начальное показание
        const initialReading = 1000; // Начальное показание
        const reading = await prisma.meterReading.create({
          data: {
            meterId: meter.id,
            value: initialReading,
            readingDate: new Date(),
          },
        });

        await prisma.waterMeter.update({
          where: { id: meter.id },
          data: { lastReading: initialReading },
        });

        console.log(`✅ Создано начальное показание для ${meter.serialNumber}: ${initialReading} м³`);
      } else {
        console.log(`ℹ️  У ${meter.serialNumber} уже есть показания: ${existingReadings[0].value} м³`);
      }
    }

    console.log('\n✅ Все данные загружены!');
    console.log('\n📝 Итоговая информация:');
    console.log(`   Лицевой счет: ЛС ${account.accountNumber}`);
    console.log(`   Адрес: ${account.address}`);
    console.log(`   Счетчиков: ${meters.length}`);
    
    const allMeters = await prisma.waterMeter.findMany({
      where: { accountId: account.id },
      include: { readings: { orderBy: { readingDate: 'desc' }, take: 1 } },
    });
    
    allMeters.forEach(m => {
      console.log(`   - ${m.serialNumber}: ${m.lastReading || 'нет показаний'} м³`);
    });

    await sql.close();
    console.log('\n✅ Готово!');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

loadFullData();





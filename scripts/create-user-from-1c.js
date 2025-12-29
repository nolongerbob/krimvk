/**
 * Скрипт для создания пользователя из базы данных 1С
 * Извлекает данные абонента и создает аккаунт в PostgreSQL
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const sql = require('mssql');

const prisma = new PrismaClient();

// Конфигурация SQL Server
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

async function createUserFrom1C() {
  try {
    console.log('🔌 Подключение к SQL Server...');
    await sql.connect(sqlConfig);
    console.log('✅ Подключено к SQL Server\n');

    // Получаем данные первого абонента
    console.log('📋 Извлечение данных абонента...');
    const result = await sql.query`
      SELECT TOP 1 
        _IDRRef,
        _Code,
        _Description,
        _Fld68,
        _Fld69,
        _Fld70,
        _Fld71,
        _Fld72,
        _Fld86,
        _Fld87,
        _Fld88,
        _Fld91
      FROM _Reference16
      WHERE _Marked = 0x00 
        AND _Description IS NOT NULL 
        AND _Description != ''
        AND _Code IS NOT NULL
        AND _Code != ''
      ORDER BY _Code
    `;

    if (result.recordset.length === 0) {
      console.log('❌ Абоненты не найдены');
      await sql.close();
      return;
    }

    const abonent = result.recordset[0];
    console.log('✅ Найден абонент:');
    console.log(`   Код: ${abonent._Code}`);
    console.log(`   ФИО: ${abonent._Description}`);
    console.log(`   Адрес: ${abonent._Fld87 || abonent._Fld88 || 'не указан'}`);
    console.log(`   Доп. поле: ${abonent._Fld68 || 'нет'}`);
    console.log(`   Поле 91: ${abonent._Fld91 || 'нет'}\n`);

    // Генерируем email на основе кода абонента (обрезаем пробелы)
    const code = String(abonent._Code || '').trim();
    const email = `abonent${code}@krimvk.local`;
    const password = code; // Пароль = код абонента
    const name = String(abonent._Description || '').trim() || `Абонент ${code}`;
    // Адрес может быть в разных полях, берем первое непустое
    const address = String(
      abonent._Fld87 || 
      abonent._Fld88 || 
      abonent._Fld68 || 
      ''
    ).trim() || 'Адрес не указан';
    const phone = String(abonent._Fld72 || '').trim() || null;

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`⚠️  Пользователь с email ${email} уже существует`);
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Имя: ${existingUser.name}\n`);
      
      // Создаем счетчики для существующего пользователя
      await createMetersForUser(existingUser.id, abonent._Code, address);
      await sql.close();
      return;
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем пользователя
    console.log('👤 Создание пользователя...');
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        address: address || null,
        phone: phone || null,
      },
    });

    console.log('✅ Пользователь создан:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Пароль: ${password} (код абонента)\n`);

    // Создаем лицевой счет
    const account = await prisma.userAccount.create({
      data: {
        userId: user.id,
        accountNumber: code,
        address: address || 'Адрес не указан',
        name: name,
        phone: phone,
      },
    });

    console.log('✅ Лицевой счет создан:');
    console.log(`   Номер: ${account.accountNumber}`);
    console.log(`   Адрес: ${account.address}\n`);

    // Создаем счетчики для лицевого счета
    await createMetersForUser(user.id, account.id, code, address);

    await sql.close();
    console.log('\n✅ Готово!');
    console.log(`\n📝 Данные для входа:`);
    console.log(`   Email: ${email}`);
    console.log(`   Пароль: ${password}`);
    console.log(`   Код абонента: ${abonent._Code}\n`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createMetersForUser(userId, accountId, abonentCode, address) {
  try {
    console.log('💧 Создание счетчиков...');

    // Проверяем, есть ли уже счетчики для этого лицевого счета
    const existingMeters = await prisma.waterMeter.findMany({
      where: { accountId },
    });

    if (existingMeters.length > 0) {
      console.log(`⚠️  У лицевого счета уже есть ${existingMeters.length} счетчик(ов)`);
      existingMeters.forEach(meter => {
        console.log(`   - ${meter.serialNumber} (${meter.type})`);
      });
      return;
    }

    // Создаем счетчик холодной воды
    // Генерируем серийный номер на основе кода абонента (обрезаем пробелы)
    const code = String(abonentCode).trim();
    const serialNumber = `ХВС-${code}`;

    const meter = await prisma.waterMeter.create({
      data: {
        userId,
        accountId,
        serialNumber,
        address: address || 'Адрес не указан',
        type: 'холодная',
        lastReading: null, // Начальные показания
      },
    });

    console.log('✅ Счетчик создан:');
    console.log(`   Серийный номер: ${meter.serialNumber}`);
    console.log(`   Тип: ${meter.type}`);
    console.log(`   Адрес: ${meter.address}\n`);

  } catch (error) {
    console.error('❌ Ошибка при создании счетчиков:', error);
    throw error;
  }
}

createUserFrom1C();


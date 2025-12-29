const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const email = 'test@krimvk.ru';
    const password = 'test123';
    const name = 'Тестовый Пользователь';

    // Проверяем, существует ли пользователь
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log(`ℹ️ Пользователь ${email} уже существует`);
      return;
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'USER',
      },
    });

    console.log('✅ Тестовый пользователь успешно создан!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Пароль: ${password}`);
    console.log(`👤 Имя: ${name}`);
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();


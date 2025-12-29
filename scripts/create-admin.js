const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'admin@krimvk.ru';
  const password = 'admin123';
  const name = 'Администратор';

  try {
    // Проверяем, существует ли уже такой пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Обновляем существующего пользователя
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email },
        data: {
          role: 'ADMIN',
          password: hashedPassword,
          name: name,
        },
      });
      console.log(`✅ Пользователь ${email} обновлен и назначен администратором!`);
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Пароль: ${password}`);
    } else {
      // Создаем нового администратора
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name,
          role: 'ADMIN',
        },
      });
      console.log(`✅ Администратор успешно создан!`);
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Пароль: ${password}`);
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();


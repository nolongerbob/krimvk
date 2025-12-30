const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Создание тестовых пользователей...\n');

  const users = [
    {
      email: 'user1@test.ru',
      password: 'user123',
      name: 'Иван Иванов',
      phone: '+7 (978) 123-45-67',
      address: 'ул. Ленина, 10, г. Симферополь',
      role: 'USER',
    },
    {
      email: 'user2@test.ru',
      password: 'user123',
      name: 'Мария Петрова',
      phone: '+7 (978) 234-56-78',
      address: 'ул. Пушкина, 25, г. Ялта',
      role: 'USER',
    },
    {
      email: 'user3@test.ru',
      password: 'user123',
      name: 'Петр Сидоров',
      phone: '+7 (978) 345-67-89',
      address: 'ул. Гагарина, 5, г. Севастополь',
      role: 'USER',
    },
    {
      email: 'admin@krimvk.ru',
      password: 'admin123',
      name: 'Администратор',
      phone: '+7 (978) 000-00-00',
      role: 'ADMIN',
    },
  ];

  for (const userData of users) {
    try {
      // Проверяем, существует ли пользователь
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existing) {
        console.log(`⏭️  Пользователь уже существует: ${userData.email}`);
        continue;
      }

      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Создаем пользователя
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          phone: userData.phone || null,
          address: userData.address || null,
          role: userData.role,
        },
      });

      console.log(`✅ Создан пользователь: ${userData.email}`);
      console.log(`   Имя: ${userData.name}`);
      console.log(`   Роль: ${userData.role}`);
      console.log(`   Пароль: ${userData.password}`);
      if (userData.phone) {
        console.log(`   Телефон: ${userData.phone}`);
      }
      console.log('');
    } catch (error) {
      console.error(`❌ Ошибка при создании пользователя ${userData.email}:`, error.message);
    }
  }

  console.log('✨ Готово!');
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });







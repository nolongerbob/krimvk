const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: './.env' });

const prisma = new PrismaClient();

async function makeAdmin() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const email = await new Promise(resolve => {
    rl.question('Введите email пользователя для назначения администратором: ', answer => {
      resolve(answer);
    });
  });

  if (!email) {
    console.log('❌ Email не может быть пустым');
    rl.close();
    await prisma.$disconnect();
    return;
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });

    console.log(`✅ Пользователь ${user.email} теперь администратор!`);
  } catch (error) {
    if (error.code === 'P2025') {
      console.log(`❌ Пользователь с email ${email} не найден`);
    } else {
      console.error('❌ Ошибка:', error.message);
    }
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

makeAdmin();







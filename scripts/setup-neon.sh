#!/bin/bash

# Скрипт для быстрой настройки базы данных в Neon

echo "🚀 Настройка базы данных Neon для KrimVK"
echo ""

# Проверка наличия DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Ошибка: DATABASE_URL не установлен"
    echo ""
    echo "Установите DATABASE_URL одним из способов:"
    echo "1. export DATABASE_URL='ваш-connection-string-из-neon'"
    echo "2. Добавьте в .env файл: DATABASE_URL='ваш-connection-string-из-neon'"
    echo ""
    echo "Получить Connection String можно на https://neon.tech"
    echo "После создания проекта скопируйте Connection String"
    exit 1
fi

echo "✅ DATABASE_URL установлен"
echo ""

# Проверка формата DATABASE_URL
if [[ ! "$DATABASE_URL" == *"neon.tech"* ]]; then
    echo "⚠️  Предупреждение: DATABASE_URL не содержит 'neon.tech'"
    echo "Убедитесь, что используете правильный Connection String из Neon"
    read -p "Продолжить? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📦 Генерация Prisma Client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при генерации Prisma Client"
    exit 1
fi

echo ""
echo "🗄️  Применение схемы базы данных..."
npx prisma db push --accept-data-loss

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при применении схемы"
    exit 1
fi

echo ""
echo "✅ База данных успешно настроена!"
echo ""
echo "📝 Следующие шаги:"
echo "1. Создайте первого администратора: npm run admin:create"
echo "2. Проверьте базу данных: DATABASE_URL='$DATABASE_URL' npx prisma studio"
echo "3. Добавьте DATABASE_URL в Vercel Environment Variables"
echo ""





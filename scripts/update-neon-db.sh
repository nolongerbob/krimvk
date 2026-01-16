#!/bin/bash

# Скрипт для обновления базы данных Neon
# Использование: DATABASE_URL='ваш-neon-connection-string' ./scripts/update-neon-db.sh

set -e

echo "🚀 Обновление базы данных Neon..."
echo ""

# Проверка наличия DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Ошибка: DATABASE_URL не установлен"
    echo ""
    echo "Установите DATABASE_URL:"
    echo "export DATABASE_URL='ваш-connection-string-из-neon'"
    echo ""
    echo "Или запустите:"
    echo "DATABASE_URL='ваш-connection-string' ./scripts/update-neon-db.sh"
    exit 1
fi

# Проверка, что это Neon
if [[ ! "$DATABASE_URL" == *"neon.tech"* ]]; then
    echo "⚠️  Предупреждение: DATABASE_URL не содержит 'neon.tech'"
    read -p "Продолжить? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ DATABASE_URL установлен"
echo ""

echo "📦 Генерация Prisma Client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при генерации Prisma Client"
    exit 1
fi

echo ""
echo "🗄️  Применение схемы базы данных к Neon..."
npx prisma db push --skip-generate --accept-data-loss

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при применении схемы"
    exit 1
fi

echo ""
echo "✅ База данных Neon успешно обновлена!"
echo ""
echo "📝 Проверьте, что таблица password_reset_tokens создана:"
echo "   npx prisma studio"

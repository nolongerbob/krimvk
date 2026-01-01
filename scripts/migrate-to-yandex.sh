#!/bin/bash

# Скрипт миграции с Vercel/Neon на Yandex Cloud

set -e

echo "🚀 Начало миграции на Yandex Cloud"
echo ""

# Проверка переменных окружения
if [ -z "$NEON_DATABASE_URL" ]; then
    echo "❌ Ошибка: NEON_DATABASE_URL не установлен"
    exit 1
fi

if [ -z "$YANDEX_DATABASE_URL" ]; then
    echo "❌ Ошибка: YANDEX_DATABASE_URL не установлен"
    exit 1
fi

echo "📦 Шаг 1: Экспорт данных из Neon..."
pg_dump "$NEON_DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при экспорте данных"
    exit 1
fi

echo "✅ Данные экспортированы"
echo ""

echo "📥 Шаг 2: Импорт данных в Yandex PostgreSQL..."
psql "$YANDEX_DATABASE_URL" < backup_*.sql

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при импорте данных"
    exit 1
fi

echo "✅ Данные импортированы"
echo ""

echo "🔄 Шаг 3: Применение миграций..."
export DATABASE_URL="$YANDEX_DATABASE_URL"
npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при применении миграций"
    exit 1
fi

echo "✅ Миграции применены"
echo ""

echo "✨ Миграция завершена успешно!"
echo ""
echo "📝 Следующие шаги:"
echo "1. Обновите переменные окружения в Yandex Cloud"
echo "2. Запустите деплой: docker-compose up -d"
echo "3. Проверьте работу сайта"


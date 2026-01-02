#!/bin/bash

# Скрипт для исправления прав доступа PostgreSQL
# Использование: ./scripts/fix-postgres-permissions.sh [username] [database]

DB_USER=${1:-krimvk_user}
DB_NAME=${2:-krimvk}

echo "🔧 Исправление прав доступа PostgreSQL для пользователя: $DB_USER"
echo "База данных: $DB_NAME"
echo ""

# Проверяем, что скрипт запущен от root или с sudo
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Запустите скрипт с sudo:"
    echo "sudo ./scripts/fix-postgres-permissions.sh $DB_USER $DB_NAME"
    exit 1
fi

echo "Выполняю команды в PostgreSQL..."
sudo -u postgres psql -d "$DB_NAME" <<EOF
-- Даем права на схему public
GRANT ALL ON SCHEMA public TO $DB_USER;

-- Даем права на все существующие таблицы
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;

-- Даем права на все последовательности (для auto-increment)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;

-- Устанавливаем права по умолчанию для будущих объектов
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;

-- Проверяем права
\dn+ public
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Права успешно установлены!"
    echo ""
    echo "Теперь можно выполнить:"
    echo "npx prisma migrate deploy"
else
    echo ""
    echo "❌ Ошибка при установке прав"
    exit 1
fi


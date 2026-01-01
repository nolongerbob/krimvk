#!/bin/bash

# Скрипт для экспорта конфигурации инфраструктуры
# Используйте перед переносом на корпоративный аккаунт

set -e

CONFIG_FILE="infrastructure-config-$(date +%Y%m%d_%H%M%S).json"

echo "📋 Экспорт конфигурации инфраструктуры"
echo ""

# Создаем JSON конфигурацию
cat > "$CONFIG_FILE" <<EOF
{
  "exported_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "test",
  "database": {
    "type": "managed_postgresql",
    "version": "15",
    "host_class": "s2.micro",
    "disk_size_gb": 20,
    "disk_type": "ssd",
    "backup_retention_days": 7,
    "connection_string": "[REDACTED - не экспортируйте пароли!]"
  },
  "storage": {
    "type": "object_storage",
    "bucket_name": "krimvk-files",
    "storage_class": "standard",
    "region": "ru-central1"
  },
  "compute": {
    "type": "cloud-run",
    "cpu": 2,
    "memory_gb": 4,
    "min_instances": 1,
    "max_instances": 10
  },
  "dns": {
    "zone": "krimvk.ru",
    "records": [
      {
        "name": "@",
        "type": "A",
        "value": "[IP_ADDRESS]"
      },
      {
        "name": "www",
        "type": "CNAME",
        "value": "@"
      }
    ]
  },
  "environment_variables": {
    "DATABASE_URL": "[REDACTED]",
    "NEXTAUTH_SECRET": "[REDACTED]",
    "NEXTAUTH_URL": "https://krimvk.ru",
    "YANDEX_STORAGE_ACCESS_KEY": "[REDACTED]",
    "YANDEX_STORAGE_SECRET_KEY": "[REDACTED]",
    "YANDEX_STORAGE_BUCKET": "krimvk-files",
    "YANDEX_STORAGE_ENDPOINT": "https://storage.yandexcloud.net"
  },
  "notes": "Заполните значения вручную перед использованием"
}
EOF

echo "✅ Конфигурация экспортирована в: $CONFIG_FILE"
echo ""
echo "⚠️  ВАЖНО:"
echo "1. Проверьте файл и заполните все значения"
echo "2. НЕ коммитьте файл с паролями в git!"
echo "3. Используйте этот файл как шаблон для корпоративного аккаунта"
echo ""
echo "📝 Следующие шаги:"
echo "1. Откройте файл: $CONFIG_FILE"
echo "2. Заполните все значения для продакшена"
echo "3. Используйте для создания инфраструктуры в корпоративном аккаунте"


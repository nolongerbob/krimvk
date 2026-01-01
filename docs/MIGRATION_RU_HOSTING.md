# Миграция на российский хостинг

## Рекомендуемая архитектура

### Вариант 1: Yandex Cloud (Рекомендуется) ⭐

**Преимущества:**
- Полностью российская инфраструктура
- Managed PostgreSQL (автоматические бэкапы)
- Object Storage (S3-совместимый)
- CDN для статики
- Container Registry
- CI/CD через Yandex Cloud Build

**Стоимость:** ~3000-5000₽/месяц

**Архитектура:**
```
┌─────────────────┐
│   Yandex CDN    │ ← Статика (images, fonts)
└─────────────────┘
         ↓
┌─────────────────┐
│  Yandex Cloud   │ ← Next.js приложение
│  Container      │   (Docker контейнер)
└─────────────────┘
         ↓
┌─────────────────┐
│ Managed         │ ← PostgreSQL база данных
│ PostgreSQL      │   (автобэкапы, репликация)
└─────────────────┘
         ↓
┌─────────────────┐
│ Object Storage  │ ← Файлы (документы, изображения)
│ (S3-совместимый)│
└─────────────────┘
```

### Вариант 2: Selectel (Бюджетный)

**Преимущества:**
- Дешевле (~1500-3000₽/месяц)
- Хорошая поддержка
- Российская инфраструктура

**Архитектура:**
- VPS для Next.js (4GB RAM, 2 CPU)
- Managed PostgreSQL
- Object Storage

### Вариант 3: Timeweb (Простой)

**Преимущества:**
- Очень простой интерфейс
- ~2000₽/месяц
- Всё в одном месте

**Недостатки:**
- Меньше гибкости
- Нет managed PostgreSQL (нужен VPS)

## План миграции

### Этап 1: Подготовка инфраструктуры

1. **Yandex Cloud:**
   - Создать аккаунт на cloud.yandex.ru
   - Создать Managed PostgreSQL
   - Создать Object Storage bucket
   - Создать Container Registry
   - Настроить CDN

2. **База данных:**
   ```bash
   # Экспорт из Neon
   pg_dump $NEON_DATABASE_URL > backup.sql
   
   # Импорт в Yandex PostgreSQL
   psql $YANDEX_DATABASE_URL < backup.sql
   ```

### Этап 2: Миграция кода

1. Заменить Vercel Blob на Yandex Object Storage
2. Обновить DATABASE_URL
3. Настроить Docker для деплоя
4. Настроить CI/CD

### Этап 3: Деплой

1. Собрать Docker образ
2. Запустить в Yandex Cloud Run или VPS
3. Настроить домен
4. Настроить SSL

## Детальные инструкции

См. файлы:
- `docker/Dockerfile` - образ для деплоя
- `docker/docker-compose.yml` - локальная разработка
- `scripts/migrate-to-yandex.sh` - скрипт миграции
- `.github/workflows/deploy.yml` - CI/CD


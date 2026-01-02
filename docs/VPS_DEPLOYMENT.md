# Инструкция по переносу на VPS

## Архитектура решения

### Рекомендуемая схема:
```
VPS (основной сервер)
├── Next.js приложение
├── PostgreSQL база данных
└── Локальное хранилище файлов (/var/www/krimvk/uploads)

ИЛИ

VPS (основной сервер)
├── Next.js приложение
├── PostgreSQL база данных
└── MinIO (S3-совместимое хранилище) - отдельный сервис
```

## Варианты хранения файлов

### Вариант 1: Локальное хранилище на VPS (рекомендую для начала)
**Плюсы:**
- Простота настройки
- Нет дополнительных сервисов
- Быстрый доступ к файлам
- Бесплатно

**Минусы:**
- Нужно делать бэкапы
- Ограничено размером диска VPS
- При масштабировании может быть проблемой

**Когда использовать:** Для начала, если файлов не очень много (<100GB)

### Вариант 2: MinIO на VPS (S3-совместимое)
**Плюсы:**
- S3 API, легко мигрировать
- Можно масштабировать
- Отдельный сервис
- Бесплатно (self-hosted)

**Минусы:**
- Нужно настраивать отдельный сервис
- Больше ресурсов

**Когда использовать:** Если нужна масштабируемость

### Вариант 3: Внешнее хранилище (Yandex Object Storage, S3)
**Плюсы:**
- Не занимает место на VPS
- Автоматические бэкапы
- CDN доступен

**Минусы:**
- Платно (но дешево)
- Зависимость от внешнего сервиса

**Когда использовать:** Для продакшена с большим объемом файлов

## Рекомендация

**Для начала: Вариант 1 (локальное хранилище)**
- Проще всего настроить
- Если понадобится - легко мигрировать на MinIO или S3
- Код уже готов (абстракция storage.ts)

## Шаги переноса

### 1. Подготовка VPS

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Установка PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Установка Nginx (для прокси и статики)
sudo apt install -y nginx

# Установка PM2 (для управления процессом)
sudo npm install -g pm2

# Создание пользователя для приложения
sudo useradd -m -s /bin/bash krimvk
sudo mkdir -p /var/www/krimvk
sudo chown krimvk:krimvk /var/www/krimvk
```

### 2. Настройка PostgreSQL

```bash
# Создание базы данных
sudo -u postgres psql

# В psql выполните:
CREATE DATABASE krimvk;
CREATE USER krimvk_user WITH PASSWORD 'your_secure_password';

# Даем права на базу данных
GRANT ALL PRIVILEGES ON DATABASE krimvk TO krimvk_user;

# ⚠️ ВАЖНО: Даем права на схему public (нужно для миграций)
# Сначала переключаемся на базу данных:
\c krimvk

# Теперь даем права (ВАЖНО: выполняйте после \c krimvk):
GRANT ALL ON SCHEMA public TO krimvk_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO krimvk_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO krimvk_user;

# Выход
\q
```

**Если уже создали пользователя, но забыли дать права на схему:**

```bash
sudo -u postgres psql -d krimvk
GRANT ALL ON SCHEMA public TO krimvk_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO krimvk_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO krimvk_user;
\q
```

### 3. Клонирование проекта

```bash
cd /var/www/krimvk
git clone https://github.com/your-repo/krimvk.git .
npm install
```

### 4. Настройка переменных окружения

Создать `.env` файл:

```env
# База данных
DATABASE_URL="postgresql://krimvk_user:your_secure_password@localhost:5432/krimvk?schema=public"

# NextAuth
# ⚠️ ВАЖНО: Если домен еще не привязан, используйте IP адрес VPS
# Вариант 1: IP адрес (для начала, пока домен не настроен)
NEXTAUTH_URL="http://YOUR_VPS_IP:3000"
# Вариант 2: После привязки домена замените на:
# NEXTAUTH_URL="https://yourdomain.com"

NEXTAUTH_SECRET="your-secret-key-here"

# Хранилище файлов
STORAGE_PROVIDER="local"
STORAGE_PATH="/var/www/krimvk/uploads"

# 1C API (если используется)
ONE_C_API_BASE_URL="http://your-1c-server:port"

# Другие переменные из вашего .env
```

**Как узнать IP адрес VPS:**
```bash
# На VPS выполните:
curl ifconfig.me
# или
hostname -I
```

### 5. Настройка хранилища файлов

```bash
# Создание директории для файлов
sudo mkdir -p /var/www/krimvk/uploads/{applications,news,water-quality}
sudo chown -R krimvk:krimvk /var/www/krimvk/uploads
sudo chmod -R 755 /var/www/krimvk/uploads
```

### 6. Применение миграций

**Для новой пустой базы данных (рекомендуется):**

```bash
cd /var/www/krimvk
npx prisma generate
npx prisma db push
```

Это создаст всю схему базы данных сразу из `schema.prisma`, включая:
- Все основные таблицы (users, applications, services и т.д.)
- Таблицы качества воды (water_quality_districts, water_quality_cities и т.д.)
- Таблицы раскрытия информации (disclosure_documents)

**Если база уже частично заполнена и нужны миграции:**

```bash
cd /var/www/krimvk
npx prisma generate
npx prisma migrate deploy
```

**Если получили ошибку "relation does not exist":**

Это означает, что база пустая, но миграции предполагают существующие таблицы. Используйте `prisma db push` вместо `migrate deploy`.

### 7. Сборка приложения

```bash
npm run build
```

### 8. Настройка PM2

Создать `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'krimvk',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/krimvk',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/krimvk/error.log',
    out_file: '/var/log/krimvk/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
```

Запуск:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # для автозапуска при перезагрузке
```

### 9. Настройка Nginx

Создать `/etc/nginx/sites-available/krimvk`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Редирект на HTTPS (после настройки SSL)
    # return 301 https://$server_name$request_uri;

    # Для начала можно оставить HTTP
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Увеличиваем лимиты для больших файлов
        client_max_body_size 50M;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }

    # Статические файлы из uploads
    location /uploads {
        alias /var/www/krimvk/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Активация:
```bash
sudo ln -s /etc/nginx/sites-available/krimvk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 10. Настройка домена

**Если домен еще не привязан:**

1. **Временно используйте IP адрес:**
   - В `.env` установите: `NEXTAUTH_URL="http://YOUR_VPS_IP:3000"`
   - В Nginx `server_name` укажите IP или `_` (catch-all)
   - Запустите приложение и проверьте работу

2. **После привязки домена:**
   - Обновите `.env`: `NEXTAUTH_URL="https://yourdomain.com"`
   - Обновите Nginx конфигурацию: `server_name yourdomain.com www.yourdomain.com;`
   - Перезапустите приложение: `pm2 restart krimvk`

**Настройка DNS:**

В DNS провайдере (где купили домен) добавьте A-запись:
```
yourdomain.com  -> IP вашего VPS
www.yourdomain.com -> IP вашего VPS
```

Подождите 5-30 минут для распространения DNS записей.

### 11. Настройка SSL (Let's Encrypt)

**Только после того, как домен привязан и DNS записи распространились:**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

После установки SSL:
- Certbot автоматически обновит Nginx конфигурацию
- Обновите `.env`: `NEXTAUTH_URL="https://yourdomain.com"`
- Перезапустите приложение: `pm2 restart krimvk`

## Обновление кода для локального хранилища

Нужно обновить файлы загрузки, чтобы использовать абстракцию `storage.ts` вместо прямого вызова Vercel Blob.

## Мониторинг и логи

```bash
# Просмотр логов PM2
pm2 logs krimvk

# Просмотр логов Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Бэкапы

### База данных
```bash
# Ежедневный бэкап (добавить в crontab)
0 2 * * * pg_dump -U krimvk_user krimvk > /backup/krimvk_$(date +\%Y\%m\%d).sql
```

### Файлы
```bash
# Бэкап uploads
0 3 * * * tar -czf /backup/uploads_$(date +\%Y\%m\%d).tar.gz /var/www/krimvk/uploads
```

## Обновление приложения

```bash
cd /var/www/krimvk
git pull
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart krimvk
```


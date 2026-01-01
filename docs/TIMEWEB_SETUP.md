# Настройка на Timeweb (бюджетный вариант)

## 💰 Стоимость: ~1100-1500₽/месяц

## 📋 Шаг 1: Заказ VPS

1. Зайдите на timeweb.com
2. Закажите VPS:
   - **Тариф:** VPS-4 (4GB RAM, 2 CPU, 50GB SSD)
   - **ОС:** Ubuntu 22.04
   - **Стоимость:** ~800₽/месяц

3. Дождитесь активации (обычно 5-10 минут)

## 📋 Шаг 2: Подключение к серверу

```bash
# Подключитесь по SSH
ssh root@ваш-ip-адрес

# Обновите систему
apt update && apt upgrade -y
```

## 📋 Шаг 3: Установка PostgreSQL

```bash
# Установка PostgreSQL
apt install postgresql postgresql-contrib -y

# Проверка версии
psql --version

# Запуск и автозапуск
systemctl start postgresql
systemctl enable postgresql
```

## 📋 Шаг 4: Настройка базы данных

```bash
# Переключитесь на пользователя postgres
su - postgres

# Создайте базу данных
createdb krimvk

# Создайте пользователя
createuser -P krimvk_user
# Введите пароль (сохраните его!)

# Дайте права пользователю
psql -c "GRANT ALL PRIVILEGES ON DATABASE krimvk TO krimvk_user;"
psql -d krimvk -c "GRANT ALL ON SCHEMA public TO krimvk_user;"

# Выйдите
exit
```

## 📋 Шаг 5: Настройка подключения

```bash
# Отредактируйте pg_hba.conf
nano /etc/postgresql/15/main/pg_hba.conf

# Добавьте строку для локального подключения:
# local   all             all                                     md5
# host    all             all             127.0.0.1/32            md5

# Отредактируйте postgresql.conf
nano /etc/postgresql/15/main/postgresql.conf

# Убедитесь, что:
# listen_addresses = 'localhost'

# Перезапустите PostgreSQL
systemctl restart postgresql
```

## 📋 Шаг 6: Установка Node.js и зависимостей

```bash
# Установка Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Проверка
node --version
npm --version

# Установка PM2 для управления процессом
npm install -g pm2
```

## 📋 Шаг 7: Установка Nginx

```bash
# Установка Nginx
apt install nginx -y

# Запуск и автозапуск
systemctl start nginx
systemctl enable nginx
```

## 📋 Шаг 8: Настройка Nginx

```bash
# Создайте конфигурацию
nano /etc/nginx/sites-available/krimvk

# Вставьте:
server {
    listen 80;
    server_name krimvk.ru www.krimvk.ru;

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
    }
}

# Активируйте конфигурацию
ln -s /etc/nginx/sites-available/krimvk /etc/nginx/sites-enabled/

# Проверьте конфигурацию
nginx -t

# Перезапустите Nginx
systemctl restart nginx
```

## 📋 Шаг 9: Установка SSL (Let's Encrypt)

```bash
# Установка Certbot
apt install certbot python3-certbot-nginx -y

# Получение сертификата
certbot --nginx -d krimvk.ru -d www.krimvk.ru

# Автоматическое обновление
certbot renew --dry-run
```

## 📋 Шаг 10: Деплой приложения

```bash
# Создайте директорию для приложения
mkdir -p /var/www/krimvk
cd /var/www/krimvk

# Клонируйте репозиторий (или загрузите файлы)
git clone https://github.com/your-repo/krimvk.git .

# Установите зависимости
npm install

# Создайте .env файл
nano .env

# Добавьте:
DATABASE_URL=postgresql://krimvk_user:ваш-пароль@localhost:5432/krimvk
NEXTAUTH_SECRET=ваш-секретный-ключ
NEXTAUTH_URL=https://krimvk.ru
NODE_ENV=production

# Сгенерируйте Prisma Client
npx prisma generate

# Примените миграции
npx prisma migrate deploy

# Соберите приложение
npm run build

# Запустите через PM2
pm2 start npm --name "krimvk" -- start
pm2 save
pm2 startup
```

## 📋 Шаг 11: Настройка бэкапов

```bash
# Создайте директорию для бэкапов
mkdir -p /backups

# Создайте скрипт бэкапа
nano /usr/local/bin/backup-db.sh

# Вставьте:
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/krimvk_$DATE.sql"

# Создайте бэкап
PGPASSWORD='ваш-пароль' pg_dump -U krimvk_user -h localhost krimvk > $BACKUP_FILE

# Сожмите бэкап
gzip $BACKUP_FILE

# Удалите старые бэкапы (старше 7 дней)
find /backups -name "*.sql.gz" -mtime +7 -delete

# Сделайте скрипт исполняемым
chmod +x /usr/local/bin/backup-db.sh

# Добавьте в cron (каждый день в 2:00)
crontab -e
# Добавьте:
0 2 * * * /usr/local/bin/backup-db.sh
```

## 📋 Шаг 12: Настройка мониторинга

```bash
# Установка мониторинга диска
apt install smartmontools -y

# Настройка алертов (опционально)
# Можно использовать UptimeRobot или аналогичные сервисы
```

## ✅ Проверка

1. Проверьте работу сайта: `https://krimvk.ru`
2. Проверьте API: `https://krimvk.ru/api/health`
3. Проверьте бэкапы: `ls -lh /backups`

## 💰 Итоговая стоимость

- VPS Timeweb: ~800₽/месяц
- Домен (если нужен): ~200₽/год
- **Итого: ~800₽/месяц** ✅

## 🔧 Обслуживание

### Обновление приложения:
```bash
cd /var/www/krimvk
git pull
npm install
npm run build
pm2 restart krimvk
```

### Просмотр логов:
```bash
pm2 logs krimvk
# Или
tail -f /var/log/nginx/error.log
```

### Перезапуск сервисов:
```bash
pm2 restart krimvk
systemctl restart nginx
systemctl restart postgresql
```

## ⚠️ Важно

1. **Бэкапы:** Настройте автоматические бэкапы
2. **Мониторинг:** Настройте алерты на диск/память
3. **Безопасность:** Регулярно обновляйте систему
4. **Логи:** Проверяйте логи регулярно

## 🆘 Проблемы и решения

### PostgreSQL не запускается:
```bash
systemctl status postgresql
journalctl -u postgresql
```

### Приложение не запускается:
```bash
pm2 logs krimvk
cd /var/www/krimvk && npm run build
```

### Nginx ошибки:
```bash
nginx -t
tail -f /var/log/nginx/error.log
```

